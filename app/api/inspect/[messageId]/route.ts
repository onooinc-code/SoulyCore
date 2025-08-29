import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;

        // In a real implementation, this endpoint would perform two key actions:
        // 1. Fetch the assembled context for the turn: This would involve finding the user message
        //    that preceded the AI message with the given `messageId`. The content of that user
        //    message (as stored in the DB) contains the full context string.
        // 2. Fetch the extraction results: This would involve finding the log entries associated with
        //    the MemoryExtractionPipeline that ran after this conversation turn. This currently
        //    requires a more robust logging system with correlation IDs.

        // For this task, we will return mock data to allow the frontend to be built.
        const mockContext = `CONTEXT: You know about these entities:
- SoulyCore (Project): The definitive, full-stack version of SoulyCore with a cloud-native, autonomous memory system.

CONTEXT: Here is some relevant information from your knowledge base:
The "Cognitive Inspector" is a new UI feature designed to provide developers with a real-time view into the AI's "thought process". It shows the exact context sent to the LLM for a given turn and the structured data that was extracted from the response.

USER PROMPT:
Can you tell me more about the new Cognitive Inspector feature?`;

        const mockExtraction = {
            "entities": [
                {
                    "name": "Cognitive Inspector",
                    "type": "UI Feature",
                    "details": "A developer tool to view pre-LLM context and post-LLM data extraction."
                }
            ],
            "knowledge": [
                "The Cognitive Inspector helps developers understand the AI's reasoning by showing its inputs and outputs for a specific turn."
            ]
        };

        return NextResponse.json({
            preLlmContext: mockContext,
            postLlmExtraction: mockExtraction,
        });

    } catch (error) {
        console.error(`Failed to fetch inspection data for message ${params.messageId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}