import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM conversations ORDER BY "lastUpdatedAt" DESC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

        const modelConfig = settings.defaultModelConfig || {};
        const agentConfig = settings.defaultAgentConfig || {};

        const { rows } = await sql`
            INSERT INTO conversations (
                title, 
                "systemPrompt", "useSemanticMemory", "useStructuredMemory",
                model, temperature, "topP"
            )
            VALUES (
                ${newTitle}, 
                ${agentConfig.systemPrompt || 'You are a helpful AI assistant.'}, 
                ${agentConfig.useSemanticMemory ?? true}, 
                ${agentConfig.useStructuredMemory ?? true},
                ${modelConfig.model || 'gemini-2.5-flash'},
                ${modelConfig.temperature ?? 0.7},
                ${modelConfig.topP ?? 0.95}
            )
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0] as Conversation, { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}