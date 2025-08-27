import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM conversations ORDER BY "lastUpdatedAt" DESC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: { message: (error as Error).message, stack: (error as Error).stack } }, { status: 500 });
    }
}

// POST a new conversation
export async function POST(req: NextRequest) {
    try {
        const { title } = await req.json();
        const newTitle = title || 'New Chat';

        // Fetch default settings from the database
        const { rows: settingsRows } = await sql`SELECT key, value FROM settings WHERE key IN ('defaultModelConfig', 'defaultAgentConfig');`;
        
        const settings = settingsRows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);

        // FIX: Provide robust fallbacks to prevent crash if settings are missing from DB
        const modelConfig = settings.defaultModelConfig || { model: 'gemini-2.5-flash', temperature: 0.7, topP: 0.95 };
        const agentConfig = settings.defaultAgentConfig || { systemPrompt: 'You are a helpful AI assistant.', useSemanticMemory: true, useStructuredMemory: true };

        const query = `
            INSERT INTO conversations (
                title, "systemPrompt", "useSemanticMemory", "useStructuredMemory", model, temperature, "topP"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            newTitle,
            agentConfig.systemPrompt,
            agentConfig.useSemanticMemory,
            agentConfig.useStructuredMemory,
            modelConfig.model,
            modelConfig.temperature,
            modelConfig.topP
        ];

        const { rows } = await db.query(query, values);
        
        return NextResponse.json(rows[0] as Conversation, { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: { message: (error as Error).message, stack: (error as Error).stack } }, { status: 500 });
    }
}