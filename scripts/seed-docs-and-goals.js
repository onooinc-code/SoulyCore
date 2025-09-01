// scripts/seed-docs-and-goals.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const fs = require('fs/promises');
const path = require('path');

const docsDirectory = path.join(process.cwd(), 'DocsV2');

const docsToSeed = [
    { key: 'vision', title: 'Project Vision', file: '00_Project_Vision.md' },
    { key: 'system_arch', title: 'System Architecture', file: '01_System_Architecture.md' },
    { key: 'cognitive_model', title: 'Cognitive Model', file: '02_Cognitive_Model.md' },
    { key: 'core_engine', title: 'Core Engine Deep Dive', file: '03_Core_Engine_Deep_Dive.md' },
    { key: 'api_ref', title: 'API Reference', file: '04_API_Reference.md' },
    { key: 'db_schema', title: 'Database Schema', file: '05_Database_Schema.md' },
    { key: 'frontend_arch', title: 'Frontend Architecture', file: '06_Frontend_Architecture.md' },
    { key: 'setup', title: 'Setup & Deployment', file: '07_Setup_And_Deployment.md' },
    { key: 'security', title: 'Security Model', file: '08_Security_Model.md' },
];

const goalsToSeed = {
    main_goal: '### The Main Goal For Hedra\nTo build a suite of interconnected AI-powered tools (HedraSoul, SoulyCore, etc.) that serve as a personal cognitive assistant for tracking, improving, and discovering new methods and features to achieve high-level personal and professional objectives.',
    ideas: '### Suggestions and Ideas\n- Integrate a knowledge graph to visually map connections between projects, ideas, and people.\n- Develop a proactive alerting system that identifies potential project risks or opportunities based on conversation analysis.\n- Create an AI-powered "Red Team" persona to challenge and critique new ideas and specifications.',
    status: '### Building Status\n- **SoulyCore v2:** Cognitive engine refactor complete. API and memory systems are robust.\n- **HedraSoul:** (Conceptual) - The overarching personal management system.\n- **Next Steps:** Focus on building out the Dashboard Center to provide a unified view of all systems.'
};

async function seedDocumentations() {
    console.log("Seeding documentations...");
    try {
        for (const doc of docsToSeed) {
            const filePath = path.join(docsDirectory, doc.file);
            let content = `## ${doc.title}\n\nDocumentation content not found.`;
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch (e) {
                console.warn(`Warning: Could not read file ${doc.file}. Using placeholder content.`);
            }
            
            await sql`
                INSERT INTO documentations (doc_key, title, content)
                VALUES (${doc.key}, ${doc.title}, ${content})
                ON CONFLICT (doc_key) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    "lastUpdatedAt" = CURRENT_TIMESTAMP;
            `;
        }
        console.log(`Successfully seeded ${docsToSeed.length} documentation entries.`);
    } catch (error) {
        console.error("Error seeding documentations table:", error);
        process.exit(1);
    }
}

async function seedHedraGoals() {
    console.log("Seeding Hedra goals...");
    try {
        for (const [key, content] of Object.entries(goalsToSeed)) {
             await sql`
                INSERT INTO hedra_goals (section_key, content)
                VALUES (${key}, ${content})
                ON CONFLICT (section_key) DO UPDATE SET
                    content = EXCLUDED.content,
                    "lastUpdatedAt" = CURRENT_TIMESTAMP;
            `;
        }
        console.log(`Successfully seeded ${Object.keys(goalsToSeed).length} Hedra goal sections.`);
    } catch (error) {
         console.error("Error seeding Hedra goals table:", error);
        process.exit(1);
    }
}

async function runAllSeeds() {
    await seedDocumentations();
    await seedHedraGoals();
    console.log("Finished seeding docs and goals.");
}

runAllSeeds();