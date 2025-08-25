import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Contact } from '@/lib/types';

// GET all contacts
export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM contacts ORDER BY name ASC;`;
        return NextResponse.json({ contacts: rows });
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

// POST a new contact or update an existing one (upsert)
export async function POST(req: NextRequest) {
    try {
        const contact = await req.json() as Partial<Contact>;
        const { name, email, company, phone, notes, tags } = contact;
        
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Use ON CONFLICT to perform an "upsert". This creates a new contact
        // or updates the specified fields if a contact with the same name/email already exists.
        const { rows } = await sql`
            INSERT INTO contacts (name, email, company, phone, notes, tags)
            VALUES (${name}, ${email}, ${company}, ${phone}, ${notes}, ${tags ? (tags as any) : null})
            ON CONFLICT (name, email) DO UPDATE SET
                company = EXCLUDED.company,
                phone = EXCLUDED.phone,
                notes = EXCLUDED.notes,
                tags = EXCLUDED.tags
            RETURNING *;
        `;
        
        // A successful upsert will always return one row.
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create or update contact:', error);
        return NextResponse.json({ error: 'Failed to create or update contact' }, { status: 500 });
    }
}