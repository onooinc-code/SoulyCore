
# Cognitive Architecture: Technical Strategy

**Document Version:** 1.0
**Status:** Proposal

---

### 1. Introduction

This document outlines the specific technical decisions and implementation strategies for building the SoulyCore Cognitive Architecture. It covers the choice of storage technologies for each memory module, the design of the supporting APIs, and the plan for multi-agent partitioning.

### 2. Storage Strategy Definition

The choice of database technology is tailored to the specific needs of each memory module to ensure optimal performance, scalability, and cost-effectiveness.

| Memory Module         | Proposed Technology | Justification                                                                                                                              |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Working Memory**    | Vercel KV (Redis)   | **Speed:** An in-memory database is required for the extremely low-latency read/write operations of a short-term scratchpad. Its volatility is acceptable for this use case. |
| **Episodic Memory**   | Pinecone            | **Vector Search:** Ideal for finding semantically similar past conversations. Will store conversation chunks as vectors, with rich metadata (timestamps, agentId, conversationId) for filtering. |
| **Semantic Memory**   | Pinecone            | **Vector Search:** The premier solution for storing and performing similarity searches on embeddings of abstract knowledge chunks.                  |
| **Entity-Relation Memory** | Vercel Postgres     | **Structured Data & Relations:** Perfect for storing entities with defined schemas. The JSONB type offers flexibility for storing varied details, and SQL provides powerful querying for relationships. |
| **Procedural Memory** | Vercel Postgres     | **Schema Definition:** Tool and workflow definitions are structured data, making them a perfect fit for a relational database table.       |
| **Affective Memory**  | Vercel Postgres     | **Metadata:** Emotional context can be stored as metadata (e.g., a `sentiment_score` column) linked via foreign key to the `episodes` table. |

### 3. API Design Proposal

To ensure a modular and maintainable system, the Cognitive Architecture will be exposed through a set of dedicated, internal RESTful API endpoints. All new endpoints will be organized under the `/api/core/` path.

#### 3.1 Memory Module Endpoints

*   `POST /api/core/memory/entity`: Create a new entity.
*   `PUT /api/core/memory/entity/{id}`: Update an existing entity.
*   `GET /api/core/memory/entity/search?name={name}`: Search for entities.
*   `POST /api/core/memory/semantic`: Add a new semantic knowledge chunk.
*   `GET /api/core/memory/semantic/search?q={query}`: Perform a similarity search in the semantic memory.
*   `POST /api/core/memory/episodic`: Add a new conversational episode.
*   `GET /api/core/memory/episodic/search?q={query}`: Search for similar past episodes.

#### 3.2 Pipeline Endpoints

These endpoints orchestrate the cognitive functions.

*   `POST /api/core/pipelines/preprocess`: Executes the entire Pre-Processing Gauntlet.
    *   **Request Body:** `{ "brainId": "...", "message": "..." }`
    *   **Response Body:** `{ "context": "...", "finalPrompt": "..." }`
*   `POST /api/core/pipelines/consolidate`: Executes the Memory Consolidation Pipeline.
    *   **Request Body:** `{ "brainId": "...", "conversationTurn": { ... } }`
    *   **Response Body:** `202 Accepted` (This is an asynchronous operation).

### 4. "Brain" & Agent Integration Strategy

A core requirement is the ability to support multiple, distinct AI "Brains" with their own partitioned memories. This will be achieved through a mandatory `brainId` identifier.

*   **Identifier:** A unique `brainId` (e.g., a UUID) will be associated with every user or project that requires a distinct memory space. This `brainId` will be a required parameter for all API calls to the cognitive architecture.

*   **Pinecone Partitioning:** We will leverage Pinecone's built-in `namespace` feature. Each `brainId` will correspond to a unique namespace, providing a hard, efficient separation of vector data. All upsert and query operations will be scoped to a specific namespace.

*   **Postgres Partitioning:** All relevant tables in Vercel Postgres (e.g., `entities`, `procedural_tools`) will include a non-nullable `agentId` or `brainId` column. All `SELECT`, `INSERT`, `UPDATE`, and `DELETE` queries will be required to include this ID in the `WHERE` clause to ensure data isolation.
