// scripts/seed-features.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

const featuresData = [
    {
        name: 'Conversation & Chat UI',
        overview: 'The primary user interface for interacting with the AI, displaying messages, and managing conversation context.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Chat Window & Message Display', description: 'Main scrollable view for conversation history.', status: '✅ Completed' },
            { subFeature: 'Message Bubbles', description: 'Distinct styling for user vs. model messages.', status: '✅ Completed' },
            { subFeature: 'Markdown & GFM Rendering', description: 'Renders rich text, code blocks, and tables in AI responses.', status: '✅ Completed' },
            { subFeature: 'Chat Input', description: 'Text area for user input, including @mentions and image uploads.', status: '✅ Completed' },
            { subFeature: 'Message Toolbar', description: 'Hover controls on messages for actions like Copy, Bookmark, Summarize.', status: '✅ Completed' },
            { subFeature: 'Conversation List Sidebar', description: 'Allows switching between and creating new conversations.', status: '✅ Completed' },
        ]),
        logic_flow: 'User sends a message via ChatInput -> AppProvider optimistically updates the UI -> An API call is made to /api/chat with the message history and context -> The API route constructs the full prompt, including memory and contact info -> A call is made to the Gemini API -> The response is received and sent back to the client -> The UI is updated with the final AI message -> A background, fire-and-forget call is made to /api/memory/pipeline to learn from the exchange.',
        key_files_json: JSON.stringify([
            'components/ChatWindow.tsx',
            'components/ChatInput.tsx',
            'components/Message.tsx',
            'app/api/chat/route.ts',
            'components/providers/AppProvider.tsx'
        ]),
        notes: 'The file upload UI is functional but could be enhanced with drag-and-drop support and previews for more file types.'
    },
    {
        name: 'Multi-Layered Memory System',
        overview: 'The core system that gives SoulyCore its persistence. It combines a structured SQL database for entities and a vector database for semantic knowledge, processed automatically after conversations.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Memory Center UI', description: 'A modal for viewing and managing structured entities.', status: '✅ Completed' },
            { subFeature: 'Memory Toggles in Agent Config', description: 'Per-conversation switches to enable/disable semantic and structured memory.', status: '✅ Completed' },
            { subFeature: 'Automatic Memory Pipeline', description: 'A background process with no direct UI that analyzes conversations and updates memory stores.', status: '✅ Completed' }
        ]),
        logic_flow: 'After a successful chat exchange, the client sends the user query and AI response to /api/memory/pipeline. This endpoint uses Gemini to perform extraction, identifying key entities and knowledge chunks. Entities are upserted into the Vercel Postgres `entities` table. Knowledge chunks are embedded (simulated) and upserted into the Pinecone vector index for future semantic retrieval.',
        key_files_json: JSON.stringify([
            'app/api/memory/pipeline/route.ts',
            'lib/gemini-server.ts',
            'lib/pinecone.ts',
            'components/MemoryCenter.tsx',
            'scripts/create-tables.js'
        ]),
        notes: 'The knowledge chunking and deduplication logic is currently simple. It could be improved with more sophisticated text-splitting algorithms to enhance the quality of semantic search results.'
    },
    {
        name: 'Contacts Hub & @Mentions',
        overview: 'A full CRUD interface for managing contacts. These contacts can be mentioned in chat to provide the AI with specific context about individuals, which is injected into the prompt.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Contacts Hub Modal', description: 'The main interface for viewing and managing all contacts.', status: '✅ Completed' },
            { subFeature: 'Contact Form', description: 'A form within the hub for creating and updating contact details.', status: '✅ Completed' },
            { subFeature: 'Searchable & Sortable Table', description: 'The contact list can be searched and sorted by various fields.', status: '✅ Completed' },
            { subFeature: '@mention Autocomplete', description: 'A popup in the chat input that suggests contacts when the user types "@".', status: '✅ Completed' }
        ]),
        logic_flow: 'The user types "@" in ChatInput, which fetches contacts from /api/contacts and displays a filtered list. When a message containing an @mention is sent, the AppProvider includes the mentioned contacts in the payload to /api/chat. The API route then formats the contact data and prepends it to the prompt as context for the Gemini model.',
        key_files_json: JSON.stringify([
            'components/ContactsHub.tsx',
            'components/ChatInput.tsx',
            'app/api/contacts/[...].ts',
            'app/api/chat/route.ts'
        ]),
        notes: 'Future enhancements could include contact groups, linking contacts to entities, or importing contacts from external sources.'
    },
    {
        name: 'Proactive AI Suggestions',
        overview: 'After a conversation turn, the AI analyzes the context and suggests a relevant next step or action to the user, displayed in a non-intrusive UI element.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Suggestion Bar', description: 'A small bar that appears above the chat input with the suggested action.', status: '✅ Completed' },
            { subFeature: 'Action Buttons', description: 'Simple "Yes" and "Dismiss" buttons to act on or ignore the suggestion.', status: '✅ Completed' }
        ]),
        logic_flow: 'The /api/chat endpoint, after receiving a valid response from the main Gemini call, makes a second, non-blocking call to the `generateProactiveSuggestion` function in `gemini-server.ts`. This function uses a specific prompt to ask the model for a next-step suggestion. The resulting string is sent back to the client, which then renders the suggestion bar UI.',
        key_files_json: JSON.stringify([
            'app/api/chat/route.ts',
            'lib/gemini-server.ts',
            'components/ChatWindow.tsx'
        ]),
        notes: 'The suggestion logic is currently broad. This could be evolved into a more structured tool-use or function-calling system for more complex and reliable actions.'
    },
    {
        name: 'SoulyDev Center',
        overview: 'An integrated control panel for developers to monitor, manage, and extend the application\'s functionality. It centralizes project documentation, feature management, and other developer tools.',
        status: '🟡 Needs Improvement',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Tabbed Interface', description: 'Allows navigation between different developer-focused sections.', status: '✅ Completed' },
            { subFeature: 'Features Dictionary', description: 'A full CRUD interface for managing this very feature list.', status: '✅ Completed' },
            { subFeature: 'Dashboard', description: 'A high-level overview of the project, displaying key metrics, statistics, and potential integrations like GitHub. The purpose is to provide a quick snapshot of the project\'s health and activity.', status: '⚪ Planned' },
            { subFeature: 'Roadmap & Ideas', description: 'A placeholder for an AI-powered idea generation and planning tool.', status: '⚪ Planned' },
            { subFeature: 'Code & Terminal', description: 'A simulated, non-functional code editor and terminal for demonstration.', status: '🟡 Needs Improvement' }
        ]),
        logic_flow: 'A primary modal component that dynamically loads different sub-components based on the active tab state. The "Features Dictionary" is fully implemented with GET, POST, PUT, and DELETE functionality via the /api/features API routes, interacting directly with the Vercel Postgres database.',
        key_files_json: JSON.stringify([
            'components/dev_center/DevCenter.tsx',
            'components/dev_center/FeaturesDictionary.tsx',
            'app/api/features/[...].ts'
        ]),
        notes: 'The placeholder tabs (Dashboard, Roadmap, Docs) need to be implemented with real functionality and API integrations to be useful. The Code & Terminal is a mock-up and would require significant effort to become a functional tool.'
    }
];

async function seedFeatures() {
    console.log("Starting to seed features data...");
    try {
        // Check if the table is already seeded to prevent duplicate entries
        const { rows: existingFeatures } = await sql`SELECT COUNT(*) FROM features;`;
        if (parseInt(existingFeatures[0].count, 10) > 0) {
            console.log("Features table already contains data. Skipping seeding.");
            return;
        }

        console.log("Inserting feature data...");
        for (const feature of featuresData) {
            await sql`
                INSERT INTO features (
                    name, 
                    overview, 
                    status, 
                    ui_ux_breakdown_json, 
                    logic_flow, 
                    key_files_json, 
                    notes
                )
                VALUES (
                    ${feature.name}, 
                    ${feature.overview}, 
                    ${feature.status}, 
                    ${feature.ui_ux_breakdown_json}, 
                    ${feature.logic_flow}, 
                    ${feature.key_files_json}, 
                    ${feature.notes}
                );
            `;
        }
        console.log(`Successfully inserted ${featuresData.length} features.`);

    } catch (error) {
        console.error("Error seeding features table:", error);
        process.exit(1);
    }
}

seedFeatures();