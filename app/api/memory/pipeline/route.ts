import { NextRequest, NextResponse } from 'next/server';
import { extractDataFromText, generateEmbedding } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { knowledgeBaseIndex } from '@/lib/pinecone';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { textToAnalyze } = await req.json();

        if (!textToAnalyze) {
            return NextResponse.json({ error: 'No text provided for analysis' }, { status: 400 });
        }

        const { entities, knowledge } = await extractDataFromText(textToAnalyze);

        // Process Entities
        let newEntitiesCount = 0;
        if (entities && entities.length > 0) {
            for (const entity of entities) {
                try {
                    // Deduplicate before inserting. ON CONFLICT DO UPDATE to refresh details.
                    const { rowCount } = await sql`
                        INSERT INTO entities (name, type, details_json)
                        VALUES (${entity.name}, ${entity.type}, ${entity.details})
                        ON CONFLICT (name, type) DO UPDATE SET details_json = EXCLUDED.details_json, "createdAt" = CURRENT_TIMESTAMP;
                    `;
                    newEntitiesCount++; // Count attempt, not just new rows
                } catch (e) {
                    console.error(`Failed to insert/update entity: ${entity.name}`, e);
                }
            }
        }

        // Process Knowledge Chunks
        let newKnowledgeCount = 0;
        if (knowledge && knowledge.length > 0) {
            const vectorsToUpsert = [];

            for (const chunk of knowledge) {
                if (chunk.split(' ').length < 5) continue; // Ignore very short chunks

                const embedding = await generateEmbedding(chunk);
                
                // Simple deduplication: Check if an exact match already exists
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
        }

        return NextResponse.json({
            message: 'Memory pipeline executed successfully.',
            processedEntities: entities.length,
            processedKnowledge: knowledge.length,
            newKnowledgeUpserted: newKnowledgeCount,
        });

    } catch (error) {
        console.error('Error in memory pipeline:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
