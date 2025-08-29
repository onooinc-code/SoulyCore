
# Master Implementation Plan: Cognitive Architecture v2.0

This document provides a high-level overview of all planned tasks for the v2.0 refactor. Each task is detailed in a separate file within the `tasks/` directory.

| Phase | Task ID | Task Description | Related Feature | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1: Foundational Backend** | 1-1 | Create Core Directory Structure | `V2 [Core] - Core Services Layer Scaffolding` | `Pending` |
| | 1-2 | Define Core Types & Interfaces | `V2 [Core] - Single Memory Module (SMM) Interfaces` | `Pending` |
| | 1-3 | Update Database Schema | `V2 [Core] - "Brain" Configuration Management` | `Pending` |
| **2: Core Module Impl.** | 2-1 | Implement LLM Provider Abstraction | `V2 [Core] - LLM Provider Abstraction Layer` | `Pending` |
| | 2-2 | Implement Working Memory Module | `V2 [Core] - Working Memory Module` | `Pending` |
| | 2-3 | Implement Episodic Memory Module | `V2 [Core] - Episodic Memory Module` | `Pending` |
| | 2-4 | Implement Semantic Memory Module | `V2 [Core] - Semantic Memory Module` | `Pending` |
| | 2-5 | Implement Structured Memory Module | `V2 [Core] - Structured Memory Module` | `Pending` |
| **3: Pipeline Orchestration**| 3-1 | Implement Context Assembly Pipeline | `V2 [Core] - Context Assembly Pipeline` | `Pending` |
| | 3-2 | Implement Memory Extraction Pipeline | `V2 [Core] - Memory Extraction Pipeline` | `Pending` |
| **4: API Layer Refactor** | 4-1 | Refactor Chat Endpoint | `V2 [API] - Refactor /api/chat Endpoint` | `Pending` |
| | 4-2 | Refactor Memory Pipeline Endpoint | `V2 [API] - Refactor /api/memory/pipeline Endpoint` | `Pending` |
| | 4-3 | Create Brain Management API | `V2 [API] - Brain Management Endpoints` | `Pending` |
| | 4-4 | Create Memory Viewer API | `V2 [API] - Memory Viewer Endpoints` | `Pending` |
| | 4-5 | Create Test Case Registry API | `V2 [QA] - Test Case Registry Backend` | `Pending` |
| **5: Frontend UI Impl.** | 5-1 | Build "The Brain Center" Hub | `V2 [UI] - The "Brain Center" Hub` | `Pending` |
| | 5-2 | Build Brain Management Tab | `V2 [UI] - Brain Management Tab` | `Pending` |
| | 5-3 | Build Memory Module Viewer Tab | `V2 [UI] - Memory Module Viewer Tab` | `Pending` |
| | 5-4 | Implement Cognitive Inspector | `V2 [UI] - Cognitive Inspector` | `Pending` |
| | 5-5 | Implement Universal Progress Indicator| `V2 [UI] - Universal Progress Indicator` | `Pending` |
| | 5-6 | Implement Long Message Collapse | `V2 [UI] - Long Message Collapse Feature` | `Pending` |
| **6: QA & Tooling** | 6-1 | Build Feature Health Dashboard | `V2 [UI] - Feature Health Dashboard UI` | `Pending` |
| | 6-2 | Build Manual Test Execution UI | `V2 [UI] - Manual Test Execution UI` | `Pending` |
