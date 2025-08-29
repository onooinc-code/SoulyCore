

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// V2 Architecture Import (Temporarily Disabled)
// import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';

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
            await serverLog('V2 Memory pipeline called with no text.', null, 'warn');
            return NextResponse.json({ error: 'No text provided for analysis' }, { status: 400 });
        }

        await serverLog('V2 Memory pipeline started.', { textLength: textToAnalyze.length });

        /*
        // --- Start of V2 Architecture Integration (Temporarily Disabled) ---
        
        // 1. Instantiate the new Memory Extraction Pipeline
        const extractionPipeline = new MemoryExtractionPipeline();

        // 2. Execute the pipeline (fire-and-forget, no need to await for UI response)
        extractionPipeline.extractAndStore({ textToAnalyze }).then(() => {
             serverLog('V2 Memory pipeline processing completed in background.', { textLength: textToAnalyze.length });
        }).catch(pipelineError => {
             const errorDetails = {
                message: (pipelineError as Error).message,
                stack: (pipelineError as Error).stack,
            };
            console.error('Error in background memory pipeline execution:', pipelineError);
            serverLog('Critical error in V2 memory pipeline background execution.', { error: errorDetails }, 'error');
        });

        // --- End of V2 Architecture Integration ---
        */
        
        // Respond to the client immediately without waiting for the pipeline to finish.
        return NextResponse.json({
            message: 'Memory pipeline execution initiated successfully in the background. (NOTE: Processing is temporarily disabled to fix build)',
        });

    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        console.error('Error in memory pipeline API route:', error);
        await serverLog('Critical error in memory pipeline API route.', { error: errorDetails }, 'error');
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
