import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AppSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all settings
export async function GET() {
    try {
        const { rows } = await sql`SELECT key, value FROM settings;`;
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);
        
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        const errorMessage = (error as Error).message;

        if (errorMessage.includes('relation "settings" does not exist')) {
            return NextResponse.json({ error: 'Settings database table not found. Please run the database initialization script against your Vercel Postgres database.' }, { status: 500 });
        }
        
        if (!process.env.POSTGRES_URL) {
             return NextResponse.json({ error: 'Database connection details are missing. Please link a Vercel Postgres database and ensure environment variables are set in your Vercel project settings.' }, { status: 500 });
        }

        return NextResponse.json({ error: 'Could not connect to the database to fetch settings. Please check your Vercel project settings and database status.' }, { status: 500 });
    }
}

// PUT (update) settings
export async function PUT(req: NextRequest) {
    try {
        const settingsToUpdate = await req.json() as Partial<AppSettings>;

        // Iterate over each setting and perform an "upsert" operation.
        // This is more robust than a manual transaction for this use case.
        for (const [key, value] of Object.entries(settingsToUpdate)) {
            // The sql template tag handles parameterization to prevent SQL injection.
            // We stringify the value object to store it in the JSONB column.
            await sql`
                INSERT INTO settings (key, value)
                VALUES (${key}, ${JSON.stringify(value)})
                ON CONFLICT (key) DO UPDATE 
                SET value = EXCLUDED.value;
            `;
        }
        
        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Failed to update settings:', error);
        const errorMessage = (error as Error).message;

        if (errorMessage.includes('relation "settings" does not exist')) {
            return NextResponse.json({ error: 'Settings database table not found. Please run the database initialization script.' }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
