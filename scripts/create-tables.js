// scripts/create-tables.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function createTables() {
    console.log("Executing CREATE TABLE statements...");
    try {
        const conversationsTable = await sql`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "agentId" VARCHAR(255) NOT NULL DEFAULT 'default',
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "systemPrompt" TEXT,
                "useSemanticMemory" BOOLEAN DEFAULT true,
                "useStructuredMemory" BOOLEAN DEFAULT true,
                model VARCHAR(255),
                temperature REAL,
                "topP" REAL
            );
        `;
        console.log("Table 'conversations' created or already exists.", conversationsTable.command);

        const messagesTable = await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "conversationId" UUID REFERENCES conversations(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "tokenCount" INTEGER,
                "responseTime" INTEGER,
                "isBookmarked" BOOLEAN DEFAULT false
            );
        `;
        console.log("Table 'messages' created or already exists.", messagesTable.command);

        const contactsTable = await sql`
            CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                company VARCHAR(255),
                phone VARCHAR(50),
                linkedin_url VARCHAR(255),
                address TEXT,
                tags TEXT[],
                notes TEXT,
                last_contacted_date TIMESTAMP WITH TIME ZONE,
                details_json JSONB,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, email)
            );
        `;
        console.log("Table 'contacts' created or already exists.", contactsTable.command);
        
        const entitiesTable = await sql`
            CREATE TABLE IF NOT EXISTS entities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                type VARCHAR(255) NOT NULL,
                details_json TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, type)
            );
        `;
        console.log("Table 'entities' created or already exists.", entitiesTable.command);
        
        const settingsTable = await sql`
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(255) PRIMARY KEY,
                value JSONB NOT NULL
            );
        `;
        console.log("Table 'settings' created or already exists.", settingsTable.command);
        
        const featuresTable = await sql`
            CREATE TABLE IF NOT EXISTS features (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                overview TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'Planned',
                ui_ux_breakdown_json JSONB,
                logic_flow TEXT,
                key_files_json JSONB,
                notes TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'features' created or already exists.", featuresTable.command);

        const logsTable = await sql`
            CREATE TABLE IF NOT EXISTS logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                message TEXT NOT NULL,
                payload JSONB,
                level VARCHAR(10) NOT NULL DEFAULT 'info'
            );
        `;
        console.log("Table 'logs' created or already exists.", logsTable.command);


        // Insert default settings if they don't exist
        await sql`
            INSERT INTO settings (key, value)
            VALUES 
                ('defaultModelConfig', '{"model": "gemini-2.5-flash", "temperature": 0.7, "topP": 0.95}'),
                ('defaultAgentConfig', '{"systemPrompt": "You are a helpful AI assistant.", "useSemanticMemory": true, "useStructuredMemory": true}'),
                ('enableDebugLog', '{"enabled": false}')
            ON CONFLICT (key) DO NOTHING;
        `;
        console.log("Default settings inserted or already exist.");


        console.log("All tables checked/created successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

createTables();