
# SoulyCore Cognitive Architecture v2.0: System Architecture

**Document Version:** 1.0
**Status:** Proposed

---

### 1. High-Level Architecture Diagram

The v2 architecture introduces a new, dedicated `Core Services` layer that decouples the frontend and API routes from the underlying memory and AI model logic. This promotes modularity, testability, and maintainability.

```mermaid
graph TD
    subgraph Browser
        A[Frontend UI - React/Next.js]
    end

    subgraph Vercel Backend
        B[Next.js API Routes - /api/v2/]
        C[Core Services Layer - Cognitive Engine]
    end

    subgraph Core Services Layer
        subgraph C
            D[Context Assembly Pipeline]
            E[Memory Extraction Pipeline]
            F[LLM Provider Abstraction]
        end
    end
    
    subgraph Memory Modules
        G[Episodic Memory - Vercel Postgres]
        H[Semantic Memory - Pinecone]
        I[Structured Memory - Vercel Postgres]
        J[Working Memory - Vercel KV]
    end

    subgraph External Services
        K[Google Gemini API]
    end

    A -- HTTP Request --> B
    B -- Calls --> C
    C -- Manages --> D & E
    D -- Reads from --> G & H & I
    D -- Writes to --> J
    E -- Writes to --> G & H &I
    F -- Communicates with --> K
    C -- Uses --> F
```

### 2. Major Data Flows

The system operates primarily through two opposing data flow pipelines, orchestrated by the Cognitive Engine.

#### 2.1. The Read Path: Context Assembly Pipeline

This flow is triggered when a user sends a message. Its purpose is to gather and assemble all necessary context for the AI model.

1.  **UI -> API:** The `ChatWindow` component sends the user's message and the `conversationId` to a new endpoint, e.g., `POST /api/v2/chat`.
2.  **API -> Core:** The API route invokes the `Context Assembly Pipeline` within the Core Services Layer.
3.  **Core -> Memory Modules:** The pipeline executes a series of parallel reads:
    *   Queries Vercel Postgres for recent messages (**Episodic Memory**).
    *   Queries Pinecone for relevant knowledge chunks (**Semantic Memory**).
    *   Queries Vercel Postgres for mentioned entities/contacts (**Structured Memory**).
4.  **Core -> Working Memory:** The retrieved context is aggregated and temporarily stored in Vercel KV (**Working Memory**).
5.  **Core -> LLM:** The final, context-rich prompt is sent via the `LLM Provider Abstraction` to the Gemini API.
6.  **Response -> UI:** The AI's response is streamed back through the layers to the user's screen.

#### 2.2. The Write Path: Memory Extraction Pipeline

This flow is triggered asynchronously after a successful conversation turn. Its purpose is to learn from the interaction.

1.  **API -> Core (Async):** The `POST /api/v2/chat` endpoint, after sending the response to the user, triggers the `Memory Extraction Pipeline` in the background (fire-and-forget).
2.  **Core -> LLM:** The pipeline sends the conversation turn (user prompt + AI response) to the Gemini API via the `LLM Provider`, but with a different set of instructions focused on extraction and analysis (e.g., "Extract key entities and facts from this text").
3.  **Core -> Memory Modules:** The extracted data from the LLM is processed and written to the appropriate long-term memory stores:
    *   New/updated facts are embedded and upserted into Pinecone (**Semantic Memory**).
    *   New/updated entities are saved to Vercel Postgres (**Structured Memory**).
    *   The conversation turn itself is saved to Vercel Postgres (**Episodic Memory**).

### 3. The AI Memory Manager

A key component of the Core Services Layer will be the **AI Memory Manager**. Initially, it will be a rule-based orchestrator for the pipelines. In the future, this component is envisioned to become an AI-driven meta-controller, capable of making intelligent decisions about what context to fetch, what information is worth saving, and when to trigger memory consolidation or summarization tasks.
