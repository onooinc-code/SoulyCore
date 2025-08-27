


import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Feature } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { featureId: string } }) {
    try {
        const { featureId } = params;
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
            UPDATE features
            SET 
                name = ${name}, 
                overview = ${overview}, 
                status = ${status}, 
                ui_ux_breakdown_json = ${ui_ux_breakdown_json ? JSON.parse(ui_ux_breakdown_json) : null}, 
                logic_flow = ${logic_flow}, 
                key_files_json = ${key_files_json ? JSON.parse(key_files_json) : null}, 
                notes = ${notes},
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${featureId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update feature ${params.featureId}:`, error);
        let errorMessage = 'Internal Server Error';
        if (error instanceof Error) {
            errorMessage = error.message;
            if (error instanceof SyntaxError) {
                errorMessage = "Invalid JSON format provided for UI Breakdown or Key Files.";
                return NextResponse.json({ error: errorMessage, details: (error as Error).stack }, { status: 400 });
            }
        }
        return NextResponse.json({ error: errorMessage, details: (error as Error).stack }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { featureId: string } }) {
    try {
        const { featureId } = params;
        const { rowCount } = await sql`DELETE FROM features WHERE id = ${featureId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Feature deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete feature ${params.featureId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: { message: (error as Error).message, stack: (error as Error).stack } }, { status: 500 });
    }
}