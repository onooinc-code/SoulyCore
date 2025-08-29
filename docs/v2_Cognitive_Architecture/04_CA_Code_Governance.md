
# SoulyCore Cognitive Architecture v2.0: Code Governance

**Document Version:** 1.1
**Status:** Proposed (Refined)

---

### 1. New Core File Structure Plan

To support the new modular architecture and ensure a clean separation of concerns, a new `core/` directory will be introduced at the project root. This directory will house all new business logic for the Cognitive Engine, keeping it isolated from the existing Next.js structure. The `app/`, `components/`, and `lib/` directories will remain at the root level.

```
soulycore/
├── app/                        // Next.js App Router (unchanged)
│   ├── api/
│   └── ...
├── components/                 // UI Components (unchanged)
├── core/                       // NEW: Core Business Logic
│   ├── ingestion/
│   │   └── ingestion.ts
│   ├── llm/
│   │   ├── providers/
│   │   │   └── gemini.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── memory/
│       ├── modules/
│       │   ├── episodic.ts
│       │   └── semantic.ts
│       ├── pipelines/
│       │   ├── context_assembly.ts
│       │   └── memory_extraction.ts
│       └── types.ts
├── docs/
├── lib/                        // Legacy business logic (to be deprecated)
└── public/
```

### 2. Deprecation & Migration Strategy

The existing logic within `lib/gemini-server.ts`, `lib/pinecone.ts`, and the primary API routes are now considered **DEPRECATED**. They will be replaced using a gradual and safe refactoring strategy.

1.  **Build Core Services:** The new `core/` directory will be built out independently with its own modules, pipelines, and tests.
2.  **Incremental Refactoring:** Existing API routes in `app/api/` will be refactored one by one. Instead of creating a separate `/v2/` namespace, the logic inside each existing route (e.g., `app/api/chat/route.ts`) will be updated to call the new, corresponding services from the `core/` directory.
3.  **Decommission Legacy Code:** As an API route is successfully migrated to use the new core services, the old business logic it previously relied on in the `lib/` directory will be marked as deprecated and eventually removed once no other routes depend on it. This ensures a controlled, gradual migration with minimal risk.

### 3. TypeScript Policy

Strictness and clarity are mandatory for the new core engine.

*   **Strict Mode:** The project's `tsconfig.json` will continue to enforce `"strict": true`.
*   **No Implicit `any`:** The `"noImplicitAny": true` rule will be strictly enforced.
*   **Centralized Types:** All shared types and interfaces for the Cognitive Engine **must** be defined in `core/memory/types.ts`. This creates a single source of truth for our data structures.
*   **Naming Conventions:**
    *   Interfaces and Types: `PascalCase` (e.g., `interface IBrainConfig`).
    *   Functions, Variables, and Methods: `camelCase` (e.g., `function assembleContext()`).
*   **JSDoc Comments:** All exported functions and class methods within the `core/` directory **must** be preceded by a JSDoc block explaining its purpose, parameters (`@param`), and return value (`@returns`).

### 4. Error Handling Protocol

Standardized error handling is critical for a robust backend.

1.  **Custom Error Classes:** A new file, `core/errors.ts`, will define custom error classes that extend the base `Error` class (e.g., `MemoryModuleError`, `LLMProviderError`, `PipelineError`).
2.  **Service-Level Throwing:** Core services (`core/`) must **throw** these custom errors when an operation fails. They should not handle the error and return `null` or `undefined`.
3.  **API-Level Catching:** The API route handlers in `app/api/` are responsible for wrapping all calls to core services in `try...catch` blocks.
4.  **Standardized Response:** When an error is caught, the API route must log the full error internally and return a standardized JSON error response to the client with a relevant HTTP status code. Example:
    ```json
    {
      "error": {
        "code": "CONTEXT_ASSEMBLY_FAILED",
        "message": "Failed to retrieve data from semantic memory."
      }
    }
    ```
