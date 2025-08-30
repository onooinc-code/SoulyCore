// scripts/seed-features.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const { execSync } = require('child_process');

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
            { subFeature: 'Enhanced Sidebar Navigation', description: 'Add visual cues for unread messages or conversation status', status: '✅ Completed' },
            { subFeature: 'Informative Tooltips', description: 'All interactive buttons and icons have detailed tooltips on hover.', status: '✅ Completed' }
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
        name: 'Right-Click Context Menu',
        overview: 'A global, context-aware right-click menu that provides quick access to over 20 of the most common and useful application functions, reducing clicks and improving user workflow efficiency.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Menu Activation & Positioning', description: 'Right-clicking anywhere in the app opens the menu at the cursor\'s position.', status: '✅ Completed' },
            { subFeature: 'Dynamic Menu Items', description: 'Menu items are context-aware; some are disabled if no conversation is active.', status: '✅ Completed' },
            { subFeature: 'Logical Grouping', description: 'Actions are grouped into logical sections like Application, Conversation, Memory, and Quick Access.', status: '✅ Completed' },
            { subFeature: 'Modal Triggers', description: 'Actions can trigger modals, such as "Add Knowledge Snippet" or "Keyboard Shortcuts".', status: '✅ Completed' }
        ]),
        logic_flow: 'The main App component has a top-level `onContextMenu` event handler. This handler prevents the default browser menu and sets the state for the custom ContextMenu component, including its open status and X/Y position. The menu items are defined as an array of objects in App.tsx, with each object containing a label, icon, action function, and a disabled condition. The ContextMenu component handles its own dismissal logic (on Escape key or outside click).',
        key_files_json: JSON.stringify([
            'components/App.tsx',
            'components/ContextMenu.tsx',
            'components/Icons.tsx',
            'components/AddKnowledgeModal.tsx',
            'components/ShortcutsModal.tsx'
        ]),
        notes: 'The context menu could be made even more specific in the future, for example, by showing different options when right-clicking on a specific message versus an empty area.'
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
        name: 'Prompts Hub & Dynamic Variables',
        overview: 'A comprehensive system for creating, managing, and using reusable prompt templates. It supports advanced organization with folders and tags, and includes a powerful dynamic variable system to turn static prompts into interactive templates.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Prompts Hub Modal', description: 'A two-panel CRUD interface for managing all saved prompts.', status: '✅ Completed' },
            { subFeature: 'Filter Sidebar', description: 'A dedicated panel within the hub to filter prompts by folder or tag.', status: '✅ Completed' },
            { subFeature: 'Prompt Form', description: 'Form for creating/editing prompts, including fields for name, content, folder, and tags.', status: '✅ Completed' },
            { subFeature: 'Chat Input Launcher', description: 'A quick-access, searchable popup list of prompts available directly in the chat input.', status: '✅ Completed' },
            { subFeature: 'Dynamic Variable Modal', description: 'A modal that appears when selecting a prompt with {{variable}} placeholders, allowing the user to fill them in before use.', status: '✅ Completed' }
        ]),
        logic_flow: 'Management: User interacts with PromptsHub UI, triggering API calls to `/api/prompts/[...].ts` which perform CRUD operations on the `prompts` table in Vercel Postgres. Usage: User clicks the launcher icon in `ChatInput.tsx`, which fetches prompts. On selection, `ChatInput.tsx` checks the prompt content for `{{variable}}` syntax. If variables are found, the `FillPromptVariablesModal` is displayed. After the user fills the form, the final, interpolated string is passed back to the `ChatInput` component\'s state. If no variables are found, the content is set directly.',
        key_files_json: JSON.stringify([
            'components/PromptsHub.tsx',
            'components/ChatInput.tsx',
            'components/FillPromptVariablesModal.tsx',
            'app/api/prompts/[...].ts',
            'scripts/create-tables.js'
        ]),
        notes: 'Could be enhanced in the future with features like prompt sharing, versioning, or a more advanced folder management system.'
    },
    {
        name: 'SoulyDev Center',
        overview: 'An integrated control panel for developers to monitor, manage, and extend the application\'s functionality. It centralizes project documentation, feature management, and other developer tools.',
        status: '🟡 Needs Improvement',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Tabbed Interface', description: 'Allows navigation between different developer-focused sections.', status: '✅ Completed' },
            { subFeature: 'Features Dictionary', description: 'A full CRUD interface for managing this very feature list.', status: '✅ Completed' },
            { subFeature: 'Dashboard', description: 'A high-level overview of the project, displaying key metrics, statistics, and potential integrations like GitHub. The purpose is to provide a quick snapshot of the project\'s health and activity.', status: '⚪ Planned' },
            { subFeature: 'Roadmap & Ideas', description: 'A placeholder for an AI-powered idea generation and planning tool.', status: '⚪ Planned' }
        ]),
        logic_flow: 'A primary modal component that dynamically loads different sub-components based on the active tab state. The "Features Dictionary" is fully implemented with GET, POST, PUT, and DELETE functionality via the /api/features API routes, interacting directly with the Vercel Postgres database.',
        key_files_json: JSON.stringify([
            'components/dev_center/DevCenter.tsx',
            'components/dev_center/FeaturesDictionary.tsx',
            'app/api/features/[...].ts'
        ]),
        notes: 'The placeholder tabs (Dashboard, Roadmap, Docs) need to be implemented with real functionality and API integrations to be useful.'
    }
];

const cognitiveFeaturesData = [
    // --- Core Engine Features ---
    {
        name: 'V2 [Core] - Core Services Layer Scaffolding',
        overview: 'Establish the new `core/` directory and its subdirectories (`llm`, `memory`, `pipelines`) to house all new, decoupled business logic for the Cognitive Engine.',
    },
    {
        name: 'V2 [Core] - "Brain" Configuration Management',
        overview: 'A foundational system to define and manage Agent "Brains," including the mapping of Brains to specific memory module namespaces for data isolation.',
    },
    {
        name: 'V2 [Core] - Single Memory Module (SMM) Interfaces',
        overview: 'Define standardized TypeScript interfaces for each memory type (Episodic, Semantic, etc.) to ensure a consistent API for the Core Engine to interact with.',
    },
    {
        name: 'V2 [Core] - LLM Provider Abstraction Layer',
        overview: 'Implement an adapter pattern to decouple the system from any specific AI provider SDK, starting with a `GeminiProvider` implementation.',
    },
    {
        name: 'V2 [Core] - Episodic Memory Module',
        overview: 'Refactored logic to manage the storage and retrieval of conversation history from Vercel Postgres, implementing the new SMM interface.',
    },
    {
        name: 'V2 [Core] - Semantic Memory Module',
        overview: 'Refactored logic for all interactions with the Pinecone vector database, including embedding generation and similarity search, implementing the SMM interface.',
    },
    {
        name: 'V2 [Core] - Structured Memory Module',
        overview: 'Refactored logic for managing structured data (entities, contacts) in Vercel Postgres, implementing the SMM interface.',
    },
    {
        name: 'V2 [Core] - Working Memory Module',
        overview: 'A new module utilizing Vercel KV (Redis) for high-speed, temporary storage of in-flight data, such as the assembled context for a single API call.',
    },
    {
        name: 'V2 [Core] - Context Assembly Pipeline',
        overview: 'The "Read Path" orchestrator that intelligently queries all relevant SMMs to build a compact, optimized context for the LLM on each conversational turn.',
    },
    {
        name: 'V2 [Core] - Memory Extraction Pipeline',
        overview: 'The "Write Path" orchestrator that runs post-conversation to analyze the exchange, extract knowledge, and commit it to the appropriate long-term SMMs.',
    },
    // --- API Features ---
    {
        name: 'V2 [API] - Refactor `/api/chat` Endpoint',
        overview: 'Rewrite the primary chat endpoint to delegate all business logic to the new Context Assembly Pipeline in the Core Engine.',
    },
    {
        name: 'V2 [API] - Refactor `/api/memory/pipeline` Endpoint',
        overview: 'Rewrite the memory processing endpoint to delegate all logic to the new Memory Extraction Pipeline in the Core Engine.',
    },
    {
        name: 'V2 [API] - Brain Management Endpoints',
        overview: 'Create a new set of CRUD API endpoints to manage Brain configurations, allowing the UI to create, read, update, and delete them.',
    },
    {
        name: 'V2 [API] - Memory Viewer Endpoints',
        overview: 'Create new read-only API endpoints that allow the Brain Center UI to query and display the contents of each SMM for inspection and manual management.',
    },
    // --- UI Features ---
    {
        name: 'V2 [UI] - The "Brain Center" Hub',
        overview: 'A new, top-level modal or dedicated view that will serve as the central management hub for all components of the Cognitive Architecture.',
    },
    {
        name: 'V2 [UI] - Brain Management Tab',
        overview: 'A UI panel within the Brain Center for creating, viewing, and configuring Agent Brains and their associated memory module namespaces.',
    },
    {
        name: 'V2 [UI] - Memory Module Viewer Tab',
        overview: 'A UI panel within the Brain Center that provides a direct view into each memory module, allowing for manual CRUD operations on stored data (e.g., deleting a specific memory).',
    },
    {
        name: 'V2 [UI] - Cognitive Inspector',
        overview: 'An "Inspect" button on messages that opens a modal showing a step-by-step breakdown of the backend cognitive pipeline (Context Assembly or Memory Extraction) that ran for that specific message turn. The data is pulled from a persistent log in the database.',
        status: '✅ Completed',
    },
    {
        name: 'V2 [UI] - Universal Progress Indicator',
        overview: 'A non-intrusive, system-wide progress indicator (e.g., a subtle top-loading bar) that visualizes all background memory operations.',
    },
    {
        name: 'V2 [UI] - Long Message Collapse Feature',
        overview: 'Implement an automatic, content-aware summarization and collapse feature for long messages in the chat view to solve the "wall of text" problem.',
    },
    // --- QA & Tooling Features ---
    {
        name: 'V2 [QA] - Test Case Registry Backend',
        overview: 'Create the `feature_tests` database table and the necessary API endpoints to manage test cases linked to features in the dictionary.',
    },
    {
        name: 'V2 [QA] - Feature Health Dashboard UI',
        overview: 'A new tab in the DevCenter to display the health status of all system features, based on the results from the Test Case Registry.',
    },
    {
        name: 'V2 [QA] - Manual Test Execution UI',
        overview: 'An interface within the Feature Health Dashboard that allows developers to manually execute registered test cases and record the results.',
    }
];


async function seedFeatures() {
    console.log("Starting to seed features data...");
    try {
        // This script now deletes all existing features and re-inserts them to ensure the data is always up-to-date with the source code.
        console.log("Clearing existing features...");
        // FIX: Added CASCADE to the TRUNCATE command to resolve the foreign key constraint error.
        // This will also truncate the dependent `feature_tests` table, which is the desired behavior for a full seed reset.
        await sql`TRUNCATE TABLE features RESTART IDENTITY CASCADE;`;
        
        console.log("Inserting original feature data...");
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
        console.log(`Successfully inserted ${featuresData.length} original features.`);

        console.log("Inserting new Cognitive Architecture v2.0 feature data...");
        for (const feature of cognitiveFeaturesData) {
            await sql`
                INSERT INTO features (name, overview, status)
                VALUES (${feature.name}, ${feature.overview}, ${feature.status || '⚪ Planned'});
            `;
        }
        console.log(`Successfully inserted ${cognitiveFeaturesData.length} new cognitive features.`);

    } catch (error) {
        console.error("Error seeding features table:", error);
        process.exit(1);
    }
}

async function runAllSeeds() {
    await seedFeatures();
    console.log("Finished seeding features. Now seeding API endpoints...");
    try {
        execSync('node scripts/seed-api-endpoints.js', { stdio: 'inherit' });
        console.log("Successfully seeded API endpoints.");
    } catch (error) {
        console.error("Error seeding API endpoints:", error);
        process.exit(1);
    }
}


runAllSeeds();