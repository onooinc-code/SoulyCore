import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

export const runtime = 'edge';

// PUT (update) a conversation
export async function PUT(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { title, summary, systemPrompt, useSemanticMemory, useStructuredMemory } = await req.json();
        
        const updates: string[] = [];
        const values: any[] = [];
        let queryIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${queryIndex++}`);
            values.push(title);
        }
        if (summary !== undefined) {
            updates.push(`summary = $${queryIndex++}`);
            values.push(summary);
        }
        if (systemPrompt !== undefined) {
            updates.push(`"systemPrompt" = $${queryIndex++}`);
            values.push(systemPrompt);
        }
        if (useSemanticMemory !== undefined) {
            updates.push(`"useSemanticMemory" = $${queryIndex++}`);
            values.push(useSemanticMemory);
        }
        if (useStructuredMemory !== undefined) {
            updates.push(`"useStructuredMemory" = $${queryIndex++}`);
            values.push(useStructuredMemory);
        }
        
        updates.push(`"lastUpdatedAt" = CURRENT_TIMESTAMP`);

        if (updates.length === 1) {
             return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(conversationId);
        const queryString = `UPDATE conversations SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *;`;

        const { rows } = await sql.query(queryString, values);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0] as Conversation);
    } catch (error) {
        console.error(`Failed to update conversation ${params.conversationId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
