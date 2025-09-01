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
    main_goal: `### Objective 1: Achieve "Total Recall Companion" Status by Q4 2024
- **Key Result 1.1:** Implement and validate the full Cognitive Architecture v2.0, ensuring all memory modules are operational.
- **Key Result 1.2:** Reduce context assembly pipeline latency to under 500ms on average.
- **Key Result 1.3:** Achieve a 95% pass rate on all registered feature health tests.`,
    ideas: `### Strategic Initiatives
- **Initiative A: Generative Tooling Framework.** Develop an SDK and sandboxed environment for the AI to create and use its own tools.
- **Initiative B: Proactive Intelligence Engine.** Build a service that analyzes user workflow patterns to proactively suggest automations and insights.
- **Initiative C: Multi-Modal Ingestion.** Extend the knowledge ingestion pipeline to support audio, video, and images.`,
    status: `### Q3 2024 Focus & KPIs
- **Focus:** Complete the Dashboard Center UI to provide a unified view of all systems and statistics.
- **KPI 1:** Ship all 8 core dashboard panels to production.
- **KPI 2:** Increase API test coverage to 80% of all endpoints.
- **KPI 3:** Onboard the first internal power user for feedback.`
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