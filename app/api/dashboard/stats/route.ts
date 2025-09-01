import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { knowledgeBaseIndex } from '@/lib/pinecone';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const [
            conversationCount,
            messageCount,
            pipelineRunStats,
            pineconeStats,
            entityCount,
            contactCount,
            featureStats
        ] = await Promise.all([
            sql`SELECT COUNT(*) FROM conversations;`,
            sql`SELECT COUNT(*) FROM messages;`,
            sql`SELECT 
                pipeline_type, 
                status, 
                COUNT(*)::int as count,
                AVG(duration_ms)::float as avg_duration
             FROM pipeline_runs 
             GROUP BY pipeline_type, status;`,
            knowledgeBaseIndex.describeIndexStats(),
            sql`SELECT COUNT(*) FROM entities;`,
            sql`SELECT COUNT(*) FROM contacts;`,
            sql`SELECT status, COUNT(*)::int as count FROM features GROUP BY status;`
        ]);

        const stats = {
            conversations: {
                total: parseInt(conversationCount.rows[0].count, 10),
            },
            messages: {
                total: parseInt(messageCount.rows[0].count, 10),
            },
            pipelines: {
                contextAssembly: {
                    completed: pipelineRunStats.rows.find(r => r.pipeline_type === 'ContextAssembly' && r.status === 'completed')?.count || 0,
                    failed: pipelineRunStats.rows.find(r => r.pipeline_type === 'ContextAssembly' && r.status === 'failed')?.count || 0,
                    avgDuration: pipelineRunStats.rows.find(r => r.pipeline_type === 'ContextAssembly' && r.status === 'completed')?.avg_duration || 0,
                },
                memoryExtraction: {
                    completed: pipelineRunStats.rows.find(r => r.pipeline_type === 'MemoryExtraction' && r.status === 'completed')?.count || 0,
                    failed: pipelineRunStats.rows.find(r => r.pipeline_type === 'MemoryExtraction' && r.status === 'failed')?.count || 0,
                    avgDuration: pipelineRunStats.rows.find(r => r.pipeline_type === 'MemoryExtraction' && r.status === 'completed')?.avg_duration || 0,
                },
            },
            memory: {
                semanticVectors: pineconeStats.totalRecordCount || 0,
                structuredEntities: parseInt(entityCount.rows[0].count, 10),
                contacts: parseInt(contactCount.rows[0].count, 10),
            },
            project: {
                featuresCompleted: featureStats.rows.find(r => r.status === '✅ Completed')?.count || 0,
                featuresInProgress: featureStats.rows.reduce((acc, r) => {
                    if (r.status !== '✅ Completed' && r.status !== '⚪ Planned') return acc + r.count;
                    return acc;
                }, 0),
                 featuresPlanned: featureStats.rows.find(r => r.status === '⚪ Planned')?.count || 0,
            }
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}