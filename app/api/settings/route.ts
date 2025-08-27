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

        // Use a transaction to update all settings atomically
        const client = await sql.connect();
        try {
            await client.query('BEGIN');
            for (const [key, value] of Object.entries(settingsToUpdate)) {
                await client.query(
                    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                    [key, JSON.stringify(value)]
                );
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
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