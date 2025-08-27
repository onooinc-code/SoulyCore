import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// PUT to toggle the bookmark status of a message
export async function PUT(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;
        
        const { rows } = await sql`
            UPDATE messages
            SET "isBookmarked" = NOT "isBookmarked"
            WHERE id = ${messageId}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to toggle bookmark for message ${params.messageId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: { message: (error as Error).message, stack: (error as Error).stack } }, { status: 500 });
    }
}