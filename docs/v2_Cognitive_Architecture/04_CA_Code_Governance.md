
# SoulyCore Cognitive Architecture v2.0: Code Governance

**Document Version:** 1.0
**Status:** Proposed

---

### 1. New Core File Structure Plan

To support the new modular architecture and ensure a clean separation of concerns, a new `src/` directory will be introduced at the root of the project. All new core logic for the Cognitive Engine will reside here. The existing `components/`, `app/`, and `lib/` directories will remain for UI and routing, but their direct business logic will be progressively moved into `src/core/`.

```
soulycore/
├── app/
│   ├── api/
│   │   ├── v2/                 // New API routes calling core services
│   │   └── (deprecated)/       // Old API routes to be removed
│   └── ...
├── components/                 // UI Components (unchanged)
├── docs/
│   └── v2_Cognitive_Architecture/
├── lib/                        // (DEPRECATED) Old business logic
├── public/
└── src/                        // NEW: Core Business Logic
    └── core/
        ├── ingestion/          // Data extraction and processing engine
        │   └── ingestion.ts
        ├── llm/                // AI model abstraction layer
        │   ├── providers/
        │   │   └── gemini.ts
        │   ├── types.ts        // LLMProvider interface
        │   └── index.ts
        └── memory/             // Core memory engine
            ├── modules/        // Implementations for each memory type
            │   ├── episodic.ts
            │   └── semantic.ts
            ├── pipelines/      // Orchestration logic
            │   ├── context_assembly.ts
            │   └── memory_extraction.ts
            └── types.ts        // Shared interfaces for Brain, SMMs, etc.
```

### 2. Deprecation & Migration Strategy

The existing logic within `lib/gemini-server.ts`, `lib/pinecone.ts`, and the primary API routes like `app/api/chat/route.ts` are now considered **DEPRECATED**. They will be replaced using a phased and safe "Strangler Fig" migration pattern.

1.  **Build New Core:** Implement the new services within `src/core/` with full functionality and unit/integration tests.
2.  **Create New V2 Endpoints:** Create new API routes under `app/api/v2/`. These routes will be thin wrappers that solely call the new services in `src/core/`.
3.  **Migrate Frontend:** The frontend application (primarily `AppProvider.tsx`) will be updated to call the new `/api/v2/` endpoints instead of the old ones.
4.  **Decommission:** Once all frontend traffic is successfully routed to the v2 endpoints, the deprecated files in `lib/` and the old API routes will be safely deleted. This ensures zero downtime and provides an easy rollback path if needed.

### 3. TypeScript Policy

Strictness and clarity are mandatory for the new core engine.

*   **Strict Mode:** The project's `tsconfig.json` will continue to enforce `"strict": true`.
*   **No Implicit `any`:** The `"noImplicitAny": true` rule will be strictly enforced.
*   **Centralized Types:** All shared types and interfaces for the Cognitive Engine **must** be defined in `src/core/memory/types.ts`. This creates a single source of truth for our data structures.
*   **Naming Conventions:**
    *   Interfaces and Types: `PascalCase` (e.g., `interface IBrainConfig`).
    *   Functions, Variables, and Methods: `camelCase` (e.g., `function assembleContext()`).
*   **JSDoc Comments:** All exported functions and class methods within the `src/core/` directory **must** be preceded by a JSDoc block explaining its purpose, parameters (`@param`), and return value (`@returns`).

### 4. Error Handling Protocol

Standardized error handling is critical for a robust backend.

1.  **Custom Error Classes:** A new file, `src/core/errors.ts`, will define custom error classes that extend the base `Error` class (e.g., `MemoryModuleError`, `LLMProviderError`, `PipelineError`).
2.  **Service-Level Throwing:** Core services (`src/core/`) must **throw** these custom errors when an operation fails. They should not handle the error and return `null` or `undefined`.
3.  **API-Level Catching:** The API route handlers in `app/api/v2/` are responsible for wrapping all calls to core services in `try...catch` blocks.
4.  **Standardized Response:** When an error is caught, the API route must log the full error internally and return a standardized JSON error response to the client with a relevant HTTP status code. Example:
    ```json
    {
      "error": {
        "code": "CONTEXT_ASSEMBLY_FAILED",
        "message": "Failed to retrieve data from semantic memory."
      }
    }
    ```
