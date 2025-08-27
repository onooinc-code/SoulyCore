import { NextRequest, NextResponse } from 'next/server';
import { extractDataFromText, generateEmbedding } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { knowledgeBaseIndex } from '@/lib/pinecone';
import { v4 as uuidv4 } from 'uuid';


async function serverLog(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level});
        `;
    } catch (e) {
        console.error("Failed to write log to database:", e);
        console.log(`[${level.toUpperCase()}] ${message}`, payload || '');
    }
}


export async function POST(req: NextRequest) {
    try {
        const { textToAnalyze } = await req.json();

        if (!textToAnalyze) {
            await serverLog('Memory pipeline called with no text.', null, 'warn');
            return NextResponse.json({ error: 'No text provided for analysis' }, { status: 400 });
        }

        await serverLog('Memory pipeline started.', { textLength: textToAnalyze.length });
        const { entities, knowledge } = await extractDataFromText(textToAnalyze);
        await serverLog('Data extraction from text completed.', { entitiesFound: entities.length, knowledgeChunks: knowledge.length });

        // Process Entities
        if (entities && entities.length > 0) {
            await serverLog('Upserting entities into database...');
            for (const entity of entities) {
                try {
                    await sql`
                        INSERT INTO entities (name, type, details_json)
                        VALUES (${entity.name}, ${entity.type}, ${entity.details})
                        ON CONFLICT (name, type) DO UPDATE SET details_json = EXCLUDED.details_json, "createdAt" = CURRENT_TIMESTAMP;
                    `;
                } catch (e) {
                    const errorDetails = { message: (e as Error).message, stack: (e as Error).stack };
                    await serverLog(`Failed to insert/update entity: ${entity.name}`, { error: errorDetails }, 'error');
                }
            }
        }

        // Process Knowledge Chunks
        let newKnowledgeCount = 0;
        if (knowledge && knowledge.length > 0) {
            await serverLog('Processing and upserting knowledge chunks to Pinecone...');
            const vectorsToUpsert = [];

            for (const chunk of knowledge) {
                if (chunk.split(' ').length < 5) continue; 

                const embedding = await generateEmbedding(chunk);
                
                const queryResponse = await knowledgeBaseIndex.query({
                    vector: embedding,
                    topK: 1,
                    filter: { "text": { "$eq": chunk } }
                });

                if (queryResponse.matches.length === 0) {
                    vectorsToUpsert.push({
                        id: uuidv4(),
                        values: embedding,
                        metadata: { text: chunk },
                    });
                    newKnowledgeCount++;
                }
            }
            if (vectorsToUpsert.length > 0) {
                await knowledgeBaseIndex.upsert(vectorsToUpsert);
            }
            await serverLog('Knowledge chunk processing complete.', { newChunksUpserted: newKnowledgeCount });
        }

        return NextResponse.json({
            message: 'Memory pipeline executed successfully.',
            processedEntities: entities.length,
            processedKnowledge: knowledge.length,
            newKnowledgeUpserted: newKnowledgeCount,
        });

    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        console.error('Error in memory pipeline:', error);
        await serverLog('Critical error in memory pipeline.', { error: errorDetails }, 'error');
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}