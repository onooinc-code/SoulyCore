import { NextRequest, NextResponse } from 'next/server';
import { extractDataFromText, generateEmbedding } from '../../../lib/gemini-server';
import { sql } from '@vercel/postgres';
import { knowledgeBaseIndex } from '../../../lib/pinecone';
import { v4 as uuidv4 } from 'uuid';

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
                    // Deduplicate before inserting
                    const { rowCount } = await sql`
                        INSERT INTO entities (name, type, details_json)
                        VALUES (${entity.name}, ${entity.type}, ${entity.details})
                        ON CONFLICT (name, type) DO NOTHING;
                    `;
                    if (rowCount && rowCount > 0) {
                        newEntitiesCount++;
                    }
                } catch (e) {
                    console.error(`Failed to insert entity: ${entity.name}`, e);
                }
            }
        }

        // Process Knowledge Chunks
        let newKnowledgeCount = 0;
        if (knowledge && knowledge.length > 0) {
            for (const chunk of knowledge) {
                const embedding = await generateEmbedding(chunk);

                // Deduplicate by semantic similarity
                const queryResponse = await knowledgeBaseIndex.query({
                    vector: embedding,
                    topK: 1,
                    filter: { text: { "$eq": chunk } } // Exact match filter for simple dedupe
                });

                if (queryResponse.matches.length === 0) {
                    await knowledgeBaseIndex.upsert([{
                        id: uuidv4(),
                        values: embedding,
                        metadata: { text: chunk },
                    }]);
                    newKnowledgeCount++;
                }
            }
        }

        return NextResponse.json({
            message: 'Memory pipeline executed successfully.',
            newEntities: newEntitiesCount,
            newKnowledge: newKnowledgeCount,
        });

    } catch (error) {
        console.error('Error in memory pipeline:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
