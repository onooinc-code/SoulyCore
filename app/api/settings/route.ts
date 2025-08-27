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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}