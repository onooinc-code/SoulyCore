
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Feature } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all features
export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM features ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch features:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new feature
export async function POST(req: NextRequest) {
    try {
        const feature = await req.json() as Partial<Feature>;
        const { 
            name, 
            overview, 
            status, 
            ui_ux_breakdown_json,
            logic_flow,
            key_files_json,
            notes
        } = feature;
        
        if (!name || !status) {
            return NextResponse.json({ error: 'Name and status are required' }, { status: 400 });
        }

        const { rows } = await sql`
            INSERT INTO features (name, overview, status, ui_ux_breakdown_json, logic_flow, key_files_json, notes, "lastUpdatedAt")
            VALUES (
                ${name}, 
                ${overview}, 
                ${status}, 
                ${ui_ux_breakdown_json ? JSON.parse(ui_ux_breakdown_json) : null}, 
                ${logic_flow}, 
                ${key_files_json ? JSON.parse(key_files_json) : null}, 
                ${notes},
                CURRENT_TIMESTAMP
            )
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create feature:', error);
        let errorMessage = 'Internal Server Error';
        if (error instanceof Error) {
            errorMessage = error.message;
            if (error instanceof SyntaxError) {
                errorMessage = "Invalid JSON format provided for UI Breakdown or Key Files.";
                return NextResponse.json({ error: errorMessage }, { status: 400 });
            }
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
