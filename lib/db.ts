import { sql } from '@vercel/postgres';

export async function createTables() {
    console.log("Checking for and creating tables if they don't exist...");
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "agentId" VARCHAR(255) NOT NULL DEFAULT 'default',
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "systemPrompt" TEXT,
                "useSemanticMemory" BOOLEAN DEFAULT true,
                "useStructuredMemory" BOOLEAN DEFAULT true
            );
        `;
        console.log("Table 'conversations' created or already exists.");

        await sql`
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
        console.log("Table 'messages' created or already exists.");

        await sql`
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
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'contacts' created or already exists.");
        
        await sql`
            CREATE TABLE IF NOT EXISTS entities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                type VARCHAR(255) NOT NULL,
                details_json TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, type)
            );
        `;
        console.log("Table 'entities' created or already exists.");

    } catch (error) {
        console.error("Error creating tables:", error);
        throw error;
    }
}

// Call this function once, perhaps in a script or during app initialization on the server.
// For Vercel, this can be run locally once or as a pre-build step.
// createTables();
