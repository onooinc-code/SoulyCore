
# SoulyCore: Backend API Architecture (As-Is)

**Document Version:** 1.0
**Status:** Baseline (Current Implementation)

---

### 1. API Endpoint Inventory

All backend logic is exposed through RESTful API endpoints built with Next.js API Routes. All data is exchanged in JSON format.

| Method | Path                                                 | Description                                                                 |
|--------|------------------------------------------------------|-----------------------------------------------------------------------------|
| POST   | `/api/chat`                                          | **Core endpoint.** Generates an AI response based on context and history.     |
| POST   | `/api/memory/pipeline`                               | Processes a conversation turn to extract and save entities and knowledge.   |
| GET    | `/api/conversations`                                 | Fetches a list of all conversations, ordered by last update.                |
| POST   | `/api/conversations`                                 | Creates a new conversation with default settings.                           |
| PUT    | `/api/conversations/[conversationId]`                | Updates a specific conversation's settings (title, system prompt, etc.).     |
| DELETE | `/api/conversations/[conversationId]`                | Deletes a specific conversation and all of its associated messages.         |
| GET    | `/api/conversations/[conversationId]/messages`       | Fetches all messages for a specific conversation.                           |
| POST   | `/api/conversations/[conversationId]/messages`       | Adds a new message to a specific conversation.                              |
| POST   | `/api/conversations/[conversationId]/generate-title` | Asks the AI to generate and save a new title for the conversation.        |
| POST   | `/api/conversations/[conversationId]/clear-messages` | Deletes all messages within a conversation without deleting the conversation itself. |
| GET    | `/api/messages/[messageId]`                          | (Not implemented)                                                           |
| PUT    | `/api/messages/[messageId]`                          | Updates the content of a specific message.                                  |
| DELETE | `/api/messages/[messageId]`                          | Deletes a specific message.                                                 |
| PUT    | `/api/messages/[messageId]/bookmark`                 | Toggles the bookmark status of a specific message.                          |
| GET    | `/api/bookmarks`                                     | Fetches all messages that have been bookmarked.                             |
| GET    | `/api/contacts`                                      | Fetches a list of all contacts.                                             |
| POST   | `/api/contacts`                                      | Creates a new contact.                                                      |
| PUT    | `/api/contacts/[contactId]`                          | Updates a specific contact.                                                 |
| DELETE | `/api/contacts/[contactId]`                          | Deletes a specific contact.                                                 |
| GET    | `/api/entities`                                      | Fetches a list of all learned entities.                                     |
| POST   | `/api/entities`                                      | Creates or updates (upserts) a new entity.                                  |
| PUT    | `/api/entities/[entityId]`                           | Updates a specific entity.                                                  |
| DELETE | `/api/entities/[entityId]`                           | Deletes a specific entity.                                                  |
| POST   | `/api/summarize`                                     | Generates a summary for a given block of text.                              |
| POST   | `/api/prompt/regenerate`                             | Asks the AI to rewrite a user's prompt based on conversation history.       |
| GET    | `/api/settings`                                      | Fetches all global application settings.                                    |
| PUT    | `/api/settings`                                      | Updates multiple global application settings in a single transaction.       |
| POST   | `/api/knowledge/add`                                 | Manually adds a new knowledge snippet to the semantic memory (Pinecone).      |
| GET    | `/api/logs/all`                                      | Fetches all stored application logs.                                        |
| DELETE | `/api/logs/all`                                      | Deletes all stored application logs.                                        |
| POST   | `/api/logs/create`                                   | Saves a new log entry to the database.                                      |
| GET    | `/api/features`                                      | Fetches all features for the DevCenter.                                     |
| POST   | `/api/features`                                      | Creates a new feature.                                                      |
| PUT    | `/api/features/[featureId]`                          | Updates a specific feature.                                                 |
| DELETE | `/api/features/[featureId]`                          | Deletes a specific feature.                                                 |
| GET    | `/api/prompts`                                       | Fetches all saved prompt templates.                                         |
| POST   | `/api/prompts`                                       | Creates a new prompt template.                                              |
| PUT    | `/api/prompts/[promptId]`                            | Updates a specific prompt template.                                         |
| DELETE | `/api/prompts/[promptId]`                            | Deletes a specific prompt template.                                         |
| POST   | `/api/prompts/execute-chain`                         | Executes a multi-step prompt workflow.                                      |

### 2. Deep Dive: `POST /api/chat` Logic Flow

This is the most complex and critical endpoint, responsible for orchestrating the AI's response generation.

1.  **Request Parsing**: The endpoint receives a JSON body containing the `messages` array (conversation history), the `conversation` object (with settings like `systemPrompt`, `useSemanticMemory`, etc.), and an optional `mentionedContacts` array.

2.  **Image Extraction**: It uses a regular expression to search the last user message for a base64-encoded image data URI. If found, the image data is extracted into a Gemini-compatible `imagePart`, and the data URI is stripped from the text content.

3.  **Context Assembly**: The endpoint conditionally builds a context string to prepend to the user's message. This happens in several stages:
    *   **Structured Memory (Entities)**: If `conversation.useStructuredMemory` is `true`, it queries the `entities` table in Vercel Postgres for all known entities and formats them into a "You know about these entities:" block.
    *   **Semantic Memory (Knowledge)**: If `conversation.useSemanticMemory` is `true`, it calls `generateEmbedding` on the user's message content, queries the Pinecone `knowledgeBaseIndex` for the top 3 most similar text chunks, and formats them into a "Here is some relevant information:" block.
    *   **Contact Context**: If the `mentionedContacts` array is present, it formats the details of each contact (name, company, notes, etc.) into a "You have the following context about people mentioned:" block.

4.  **Final Prompt Construction**: The various context blocks are joined together with the user's text message to form the final, comprehensive prompt that will be sent to the AI.

5.  **History Formatting**: The `messages` array is formatted into the `Content[]` structure required by the `@google/genai` SDK. The final user prompt (with context and optionally the image part) is added as the last item in the history.

6.  **Gemini API Call**: It calls the `generateChatResponse` function from `lib/gemini-server.ts`, passing the formatted history, the conversation's system prompt, and model parameters (temperature, topP).

7.  **Proactive Suggestion (Secondary Call)**: After successfully receiving a response from Gemini, it appends the AI's response to the history and makes a *second*, non-critical call to the `generateProactiveSuggestion` function. This asks the model to suggest a relevant next action based on the latest exchange.

8.  **Response to Client**: The endpoint sends a JSON response to the client containing the main AI `response` text and the `suggestion` string (which can be `null`).

9.  **Error Handling & Logging**: The entire process is wrapped in a `try...catch` block. It uses a `serverLog` helper function to write detailed logs of its operations (e.g., "Injected mentioned contacts context", "Generating AI response from Gemini") to the `logs` table in the database for debugging.
