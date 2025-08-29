
# SoulyCore Cognitive Architecture v2.0: Technical Strategy

**Document Version:** 1.0
**Status:** Proposed

---

### 1. Technology Stack Definition

The v2 architecture will leverage a modern, scalable, and managed technology stack to minimize operational overhead and maximize performance.

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS | Existing, proven stack. Excellent performance and developer experience. |
| **Backend/API** | Next.js API Routes | Co-located with the frontend for simplicity and seamless data fetching. |
| **Core Engine** | TypeScript, Node.js | Provides type safety and leverages the Vercel serverless environment. |
| **Episodic Memory** | Vercel Postgres | Reliable, managed SQL for storing chronological conversation history. |
| **Semantic Memory** | Pinecone | Industry-leading, high-performance vector database for semantic search. |
| **Structured Memory**| Vercel Postgres | Ideal for schema-enforced data like contacts, entities, and tools. |
| **Working Memory** | Vercel KV (Redis) | High-speed, ephemeral key-value store perfect for temporary context assembly. |
| **AI Models** | Google Gemini API (`@google/genai`) | Primary provider for generation and extraction tasks. |

### 2. Model & Provider Abstraction

To ensure long-term flexibility and avoid vendor lock-in, all interactions with AI models will be routed through an abstraction layer.

*   **Strategy:** Implement an adapter pattern.
*   **Implementation:**
    1.  Define a generic `LLMProvider` interface within the new `src/core/llm/` directory.
    2.  This interface will mandate methods like `generateContent(prompt: string, config: ModelConfig): Promise<string>` and `generateEmbedding(text: string): Promise<number[]>`.
    3.  Create a concrete implementation, `GeminiProvider`, that implements this interface and contains the specific logic for calling the `@google/genai` SDK.
    4.  All other parts of the Core Engine will only ever interact with the `LLMProvider` interface, not the concrete `GeminiProvider`. This will allow us to easily add an `AnthropicProvider` or `OpenAIProvider` in the future with minimal code changes.

### 3. Storage Strategy Definition

This table explicitly maps the conceptual memory modules from the Cognitive Model to their chosen storage technologies.

| Memory Module | Storage Technology | Primary Table(s) / Index | Rationale |
| :--- | :--- | :--- | :--- |
| **Episodic** | Vercel Postgres | `conversations`, `messages` | SQL provides strong transactional integrity for chronological, relational data. |
| **Semantic** | Pinecone | `soul-knowledgebase-v2` | Optimized for low-latency, high-throughput vector similarity search. |
| **Structured**| Vercel Postgres | `contacts`, `entities_v2` | The relational nature of SQL is perfect for structured, user-managed data. |
| **Procedural**| Vercel Postgres | `tools`, `workflows` | (Future) Storing tool schemas and workflow definitions in SQL allows for easy management. |
| **Working** | Vercel KV (Redis) | `session:[sessionId]` | Extremely fast reads/writes for ephemeral data needed during a single API request. |

### 4. Quality Assurance & Testing Strategy

Quality is paramount in this refactor. The existing `DevCenter` will be upgraded to support a robust QA process.

*   **Feature Health Dashboard:** The existing dashboard will be enhanced to poll the status of all system components and display a clear health status (🟢, 🔴, 🟡).
*   **Test Case Registry:** A new database table, `feature_tests`, will be created. It will have a foreign key relationship to the `features` table. Each entry will contain:
    *   `featureId` (FK)
    *   `description`: A plain-text description of the test case.
    *   `manual_steps`: A markdown field detailing the steps for manual verification.
    *   `automated_script`: A text field containing a code snippet for an automated test (e.g., using Jest or Playwright).
    *   `expected_result`: A clear description of the success criteria.
*   **Test Execution:** The Feature Health Dashboard will include a UI to trigger these tests. Initially, this will be for manual execution and viewing, with a future goal of integrating with a CI/CD pipeline for fully automated, scheduled test runs.
