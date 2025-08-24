import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Contact } from '@/lib/types';

export const runtime = 'edge';

export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM contacts ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const contact = await req.json() as Partial<Contact>;
        const { name, email, company, phone, notes } = contact;
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        const { rows } = await sql`
            INSERT INTO contacts (name, email, company, phone, notes)
            VALUES (${name}, ${email}, ${company}, ${phone}, ${notes})
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create contact:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
