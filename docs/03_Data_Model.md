
# SoulyCore: Data Model (As-Is)

**Document Version:** 1.0
**Status:** Baseline (Current Implementation)

---

### 1. Database Schema Overview

SoulyCore's structured memory is powered by a Vercel Postgres database. The schema is designed to store all data related to conversations, user-managed content, application configuration, and developer tooling. The tables are created and maintained by the script located at `scripts/create-tables.js`.

### 2. Table Definitions

#### `conversations`
Stores the metadata for each individual chat session.

| Column              | Type          | Description                                                    |
|---------------------|---------------|----------------------------------------------------------------|
| `id`                | UUID (PK)     | Unique identifier for the conversation.                        |
| `agentId`           | VARCHAR(255)  | (Future use) Identifier for the AI agent instance.             |
| `title`             | VARCHAR(255)  | The user-facing title of the chat.                             |
| `summary`           | TEXT          | An AI-generated summary of the conversation.                   |
| `createdAt`         | TIMESTAMPTZ   | Timestamp of when the conversation was created.                |
| `lastUpdatedAt`     | TIMESTAMPTZ   | Timestamp of the last message or update. Used for sorting.     |
| `systemPrompt`      | TEXT          | The system instructions provided to the AI for this chat.      |
| `useSemanticMemory` | BOOLEAN       | Flag to control fetching context from Pinecone.                |
| `useStructuredMemory`| BOOLEAN       | Flag to control fetching context from the `entities` table.  |
| `model`             | VARCHAR(255)  | The specific AI model used (e.g., 'gemini-2.5-flash').       |
| `temperature`       | REAL          | The creativity setting for the model in this chat.             |
| `topP`              | REAL          | The nucleus sampling setting for the model in this chat.       |

#### `messages`
Stores every message exchanged within all conversations.

| Column           | Type        | Description                                                       |
|------------------|-------------|-------------------------------------------------------------------|
| `id`             | UUID (PK)   | Unique identifier for the message.                                |
| `conversationId` | UUID (FK)   | Foreign key linking to the `conversations` table. **Deletes cascade.** |
| `role`           | VARCHAR(50) | The role of the sender, either 'user' or 'model'.                 |
| `content`        | TEXT        | The full text content of the message (supports markdown).         |
| `createdAt`      | TIMESTAMPTZ | Timestamp of when the message was created.                        |
| `tokenCount`     | INTEGER     | An estimated count of tokens used by the message.                 |
| `responseTime`   | INTEGER     | For model messages, the generation time in milliseconds.          |
| `isBookmarked`   | BOOLEAN     | Flag to indicate if the user has bookmarked this message.         |

#### `contacts`
Stores information about people, managed by the user in the Contacts Hub.

| Column      | Type        | Description                                                              |
|-------------|-------------|--------------------------------------------------------------------------|
| `id`        | UUID (PK)   | Unique identifier for the contact.                                       |
| `name`      | VARCHAR(255)| The contact's name.                                                      |
| `email`     | VARCHAR(255)| The contact's email. A `UNIQUE` constraint exists on `(name, email)`.    |
| `company`   | VARCHAR(255)| The contact's company.                                                   |
| `phone`     | VARCHAR(50) | The contact's phone number.                                              |
| `notes`     | TEXT        | Free-form notes about the contact.                                       |
| `tags`      | TEXT[]      | An array of text tags for categorization.                                |
| `createdAt` | TIMESTAMPTZ | Timestamp of when the contact was created.                               |

#### `entities`
Stores structured information (facts) automatically extracted by the AI from conversations.

| Column         | Type        | Description                                                               |
|----------------|-------------|---------------------------------------------------------------------------|
| `id`           | UUID (PK)   | Unique identifier for the entity.                                         |
| `name`         | VARCHAR(255)| The name of the entity (e.g., 'Project Phoenix').                         |
| `type`         | VARCHAR(255)| The category of the entity (e.g., 'Project', 'Person', 'Concept').        |
| `details_json` | TEXT        | A string containing JSON with additional details about the entity.      |
| `createdAt`    | TIMESTAMPTZ | Timestamp of when the entity was first created or last updated.           |

#### `features`
Stores the data for the Features Dictionary in the SoulyDev Center.

| Column                 | Type        | Description                                                              |
|------------------------|-------------|--------------------------------------------------------------------------|
| `id`                   | UUID (PK)   | Unique identifier for the feature.                                       |
| `name`                 | VARCHAR(255)| The name of the feature.                                                 |
| `overview`             | TEXT        | A high-level description of the feature.                                 |
| `status`               | VARCHAR(50) | The current implementation status (e.g., '✅ Completed').                |
| `ui_ux_breakdown_json` | JSONB       | A JSON object detailing sub-features and their statuses.                 |
| `logic_flow`           | TEXT        | A description of the feature's technical logic.                          |
| `key_files_json`       | JSONB       | A JSON array of file paths relevant to the feature.                      |
| `notes`                | TEXT        | Additional developer notes.                                              |

#### `prompts`
Stores reusable prompt templates created in the Prompts Hub.

| Column             | Type        | Description                                                              |
|--------------------|-------------|--------------------------------------------------------------------------|
| `id`               | UUID (PK)   | Unique identifier for the prompt.                                        |
| `name`             | VARCHAR(255)| The name of the prompt template.                                         |
| `content`          | TEXT        | The body of the prompt, may contain `{{variable}}` placeholders.         |
| `folder`           | VARCHAR(255)| An optional folder name for organization.                                |
| `tags`             | TEXT[]      | An array of text tags for categorization.                                |
| `type`             | VARCHAR(50) | The prompt type, either 'single' or 'chain'.                             |
| `chain_definition` | JSONB       | For 'chain' type, defines the sequence of steps and their I/O mappings.  |

#### `logs`
A table for storing application logs for debugging purposes.

| Column      | Type        | Description                                                 |
|-------------|-------------|-------------------------------------------------------------|
| `id`        | UUID (PK)   | Unique identifier for the log entry.                        |
| `timestamp` | TIMESTAMPTZ | The exact time the log was generated.                       |
| `message`   | TEXT        | The log message.                                            |
| `payload`   | JSONB       | An optional JSON object containing contextual data.         |
| `level`     | VARCHAR(10) | The log level: 'info', 'warn', or 'error'.                  |

#### `settings`
A simple key-value store for global application configuration.

| Column | Type        | Description                                |
|--------|-------------|--------------------------------------------|
| `key`  | VARCHAR(PK) | The unique key for the setting.            |
| `value`| JSONB       | The value of the setting, stored as JSON.  |
