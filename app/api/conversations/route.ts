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
        const { title, systemPrompt, useSemanticMemory, useStructuredMemory } = await req.json();
        const newTitle = title || 'New Chat';

        const { rows } = await sql`
            INSERT INTO conversations (title, "systemPrompt", "useSemanticMemory", "useStructuredMemory")
            VALUES (${newTitle}, ${systemPrompt || 'You are a helpful AI assistant.'}, ${useSemanticMemory ?? true}, ${useStructuredMemory ?? true})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0] as Conversation, { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}