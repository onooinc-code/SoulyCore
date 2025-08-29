# SoulyCore Cognitive Architecture: Product Requirements Document (PRD) v2.0

**Document Status:** Final
**Version:** 2.0
**Owner:** Cognitive Architecture Team

---

## 1. Core Vision & Guiding Principles

This document outlines the requirements for the foundational refactoring of SoulyCore's memory and cognitive systems. The primary objective is to evolve the application from a stateful assistant into a self-improving, multi-agent cognitive companion.

### 1.1. Multi-Agent Readiness
The architecture MUST be designed from the ground up to support a future fleet of specialized AI Agents. Each agent will operate with a unique "Brain" composed of shared and/or private memory modules, enabling specialized knowledge domains (e.g., a "Coding Agent," a "Research Agent").

### 1.2. Total Recall Companion
The system is intended for continuous, 24/7 operation as a user's personal cognitive assistant. It must reliably capture, process, and retrieve information over long periods, acting as a perfect, total-recall extension of the user's own memory.

### 1.3. Self-Improving System
The primary goal of the memory system is not just storage, but active learning. The architecture MUST include mechanisms for knowledge synthesis, connection forming, and proactive error avoidance, allowing the system to become more intelligent and accurate over time.

### 1.4. AI-Managed Cognition
The system will employ a hybrid control model. While users will have granular manual control, a specialized, internal "AI Memory Manager" will be responsible for the autonomous, intelligent orchestration of memory consolidation, synthesis, and retrieval workflows.

---

## 2. Architectural Concepts

### 2.1. The "Brain" Concept
A "Brain" is a high-level container that defines an Agent's cognitive makeup. It is a configuration manifest, not a data store itself.
- **2.1.1.** A Brain configuration MUST specify the unique `namespace` for each Single Memory Module it is linked to.
- **2.1.2.** This allows multiple Brains to share memory modules (e.g., a common `corporate_wiki` namespace) or have private ones (e.g., a `private_journal` namespace).

### 2.2. Single Memory Modules (SMMs)
SMMs are atomic, specialized, and abstracted units, each responsible for one specific type of memory (e.g., Episodic, Semantic, Entity-Relation).
- **2.2.1.** Each SMM must be independently manageable and adhere to a standardized interface for search and CRUD operations.
- **2.2.2.** The system must be designed to allow for the future addition of new SMM types with minimal refactoring.

### 2.3. Workflow Memory Pipelines
These are complex, multi-step processes that orchestrate calls across multiple SMMs to perform higher-level cognitive functions.
- **2.3.1. Context Assembly Pipeline:** An intelligent workflow that retrieves context from multiple SMMs to build the optimal prompt for an LLM call.
- **2.3.2. Memory Consolidation Pipeline:** An asynchronous workflow that extracts and saves new knowledge from interactions into the appropriate SMMs.

---

## 3. Key System-Wide Features & Requirements

### 3.1. Granular Manual Control
The UI MUST provide tools for users to manually interact with the memory system. This includes the ability to browse, edit, and delete memories, as well as manually inject any specific piece of memory into the context of the current conversation.

### 3.2. Universal Progress Indicator
All asynchronous memory operations (e.g., memory consolidation, file ingestion) that may take more than a few seconds MUST be represented by a universal, non-intrusive progress indicator in the UI, providing transparency to the user.

### 3.3. Multi-Source Ingestion Engine
The system MUST include a dedicated ingestion engine capable of extracting knowledge from multiple sources beyond user conversations. Initial support must be planned for:
- Web page URLs
- Uploaded files (e.g., .txt, .md, .pdf)

### 3.4. Model & Provider Abstraction
The cognitive engine MUST be decoupled from any single AI model or provider (e.g., Google Gemini). An adapter pattern must be used to ensure that the core logic can be easily switched to use different models or providers in the future.

---

## 4. The "Brain Center": Central Management Hub

A new, dedicated section of the application, the "Brain Center," will serve as the central UI for managing all aspects of the cognitive architecture.

### 4.1. Brain Management
A UI for creating, configuring, and assigning Brains to agents. This interface must allow for the mapping of Brains to their respective memory `namespaces`.

### 4.2. Memory Module Management
A dedicated management tab MUST be provided for each Single Memory Module. This will allow for manual CRUD operations on the memories within that module (e.g., editing a specific Entity, deleting a specific conversation summary).

### 4.3. Workflow Visualization & Cognitive Inspector
- **4.3.1.** The Brain Center must include dedicated UIs to visualize the step-by-step data flow of the Context Assembly and Memory Consolidation workflows.
- **4.3.2.** Every chat message sent by the AI must feature an "Inspect" button. Clicking this button will reveal:
    - The full pre-processing context (retrieved memories) used to generate that specific response.
    - The post-processing extractions (new entities, knowledge) learned from that interaction.

### 4.4. Dedicated Memory Log Viewer
A separate, filterable Log Panel must be created exclusively for memory operations, distinct from the general application debug log.

---

## 5. Core Problem to Solve: The "Long Context" Challenge

As conversations and ingested documents grow, they can exceed the context window of LLMs. The system must address this proactively.

### 5.1. Solution Path
The system MUST implement an automatic, intelligent, content-aware summarization and collapse feature.
- **5.1.1.** Long messages or documents will be automatically collapsed in the UI to a concise summary.
- **5.1.2.** A clear "Show Original" or "Expand" button MUST always be present to allow the user to view the full, unabridged content on demand.
- **5.1.3.** When passing context to the LLM, the system will intelligently decide whether to use the summary or the full text based on relevance and token constraints.

---

## 6. Quality Assurance & System Health

To ensure the stability and reliability of this complex system, a dedicated QA and monitoring framework is required.

### 6.1. The "Feature Health Dashboard"
A dedicated UI within the `DevCenter` must be created to monitor the health of all system features, represented by clear status indicators (e.g., 🟢 Operational, 🔴 Failing, 🟡 Degraded).

### 6.2. Feature Test Registry
Every feature defined in the `Features Dictionary` MUST have a linked, structured Test Case. A test case must include:
- A clear description of the test.
- Manual, step-by-step instructions for a human tester.
- A code snippet for an automated test (if applicable).
- A clear definition of the expected result.

### 6.3. Manual & Automated Test Execution
The Feature Health Dashboard MUST allow for:
- Manual, one-click execution of defined test cases by a developer.
- Trigger-based or scheduled execution of automated tests to continuously monitor system health.