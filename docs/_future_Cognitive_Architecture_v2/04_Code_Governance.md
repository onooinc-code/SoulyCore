
# Cognitive Architecture: Code Governance & Structure

**Document Version:** 1.0
**Status:** Proposal

---

### 1. Introduction

To ensure the long-term maintainability, scalability, and readability of the new Cognitive Architecture, we will adhere to a strict set of code governance rules. This document outlines the mandatory file structure and TypeScript policies for all new development related to this system.

### 2. A. Proposed File Structure Plan

All new code for the Cognitive Architecture will reside within a new top-level `src/core/` directory. This isolates the core "brain" logic from the application's UI (`components`, `app`) and existing utility functions (`lib`).

The proposed structure is as follows:

```
soulycore/
├── src/
│   ├── app/                  # Next.js App Router (UI routes, API routes)
│   ├── components/           # All React components
│   ├── lib/                  # Existing general-purpose libraries (db, pinecone client, etc.)
│   │
│   └── core/                 # <-- NEW COGNITIVE ARCHITECTURE LOGIC
│       ├── agents/           # (Future) Logic for different agent personalities/brains
│       │
│       ├── memory/           # Core memory modules and types
│       │   ├── modules/      # Concrete implementations for each memory type
│       │   │   ├── episodic.ts
│       │   │   ├── semantic.ts
│       │   │   └── entity.ts
│       │   │
│       │   ├── types.ts      # <-- CENTRALIZED TYPES (Single Source of Truth)
│       │   └── utils.ts      # Helper functions for memory operations
│       │
│       ├── pipelines/        # Implementations of the cognitive functions
│       │   ├── preprocess.ts # The "Pre-Processing Gauntlet" logic
│       │   └── consolidate.ts# The "Memory Consolidation" logic
│       │
│       └── services/         # Clients/connectors for external services
│           ├── gemini.ts
│           ├── pinecone.ts
│           └── vercel_kv.ts
│
└── docs/                     # Project documentation (MD files)
```

**Note:** The initial implementation will focus on creating the `src/core/` directory and its subdirectories. Migrating existing `app`, `components`, and `lib` directories into `src/` will be a subsequent refactoring step to unify the project structure.

### 3. B. TypeScript Policy

A strict typing policy is essential for preventing bugs and improving developer experience.

#### 3.1 Single Source of Truth for Types

*   **Mandate:** All shared types, interfaces, and enums related to the Cognitive Architecture **must** be defined in a single, centralized file: `src/core/memory/types.ts`.
*   **Rationale:** This prevents type duplication and ensures that any changes to a data structure are reflected across the entire system. It serves as a data contract for the architecture.

#### 3.2 No Redundant or Local Type Definitions

*   **Prohibition:** Do not define local, one-off types for memory objects (e.g., `Entity`, `MemoryChunk`) within components, API routes, or other files.
*   **Enforcement:** All files interacting with the memory system must import the necessary types directly from the central `types.ts` file.

**Correct Usage:**
```typescript
// In any file, e.g., src/app/api/core/memory/entity/route.ts
import type { Entity, EntityRelation } from '@/core/memory/types';

function handleEntity(entity: Entity) {
  // ...
}
```

#### 3.3 Example `types.ts` Structure

The `src/core/memory/types.ts` file will be organized by module for clarity.

```typescript
// src/core/memory/types.ts

// =================================
// Base & Common Types
// =================================
export type BrainId = string;
export type Embedding = number[];

// =================================
// Entity-Relation Memory
// =================================
export interface Entity {
  id: string;
  brainId: BrainId;
  name: string;
  type: 'Person' | 'Project' | 'Company' | 'Concept';
  details: Record<string, any>; // Flexible JSONB store
  createdAt: Date;
  lastAccessedAt: Date;
}

// =================================
// Semantic & Episodic Memory
// =================================
export interface MemoryVector {
  id: string;
  brainId: BrainId;
  content: string;
  embedding: Embedding;
  source: string; // e.g., 'conversation:uuid' or 'manual'
  createdAt: Date;
}
```

### 4. C. Migration & Integration Plan

#### 4.1 Deprecation of `lib/types.ts`
The existing `lib/types.ts` file served the initial application well, but it mixes UI-specific types with potential core data structures. To adhere to the new governance model, the following will occur:

*   **Migration:** All types directly related to the cognitive architecture's data models (e.g., `Entity`, `Knowledge`, `Prompt`) will be moved to the new single source of truth at `src/core/memory/types.ts`.
*   **Refactoring:** UI-specific types (e.g., `FeatureStatus`, `UiUxSubFeature`) will remain in a dedicated types file, likely `lib/ui-types.ts`, to maintain separation of concerns.
*   **Deprecation:** The `lib/types.ts` file will be marked for deprecation and eventually removed once all imports have been updated to point to the new, more specific type definition files.

#### 4.2 Refactoring API Routes
The current API routes in `app/api/` contain significant business logic. Under the new architecture, they will be refactored to act as thin "controller" layers.

*   **Separation of Concerns:** The responsibility of the API route will be limited to:
    1.  Receiving and validating HTTP requests.
    2.  Extracting necessary parameters (e.g., `brainId`, message content).
    3.  Calling the appropriate high-level function from the `src/core/pipelines/` directory.
    4.  Formatting the result from the core engine into an HTTP response.
*   **Example Refactor (`app/api/chat/route.ts`):**
    *   **Current:** Contains logic for fetching from memory, building prompts, and calling the Gemini client.
    *   **New:** Will be simplified to call a single function, such as `handleChatRequest(brainId, messages)`, which will be imported from a new `src/core/chat-handler.ts` or similar file. This function, in turn, will orchestrate calls to the `preprocess` and `consolidate` pipelines. This isolates the core cognitive processing from the Next.js framework specifics.