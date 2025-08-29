
# SoulyCore: Project Overview (As-Is)

**Document Version:** 1.0
**Status:** Baseline (Current Implementation)

---

### 1. High-Level Summary

SoulyCore is a full-stack, AI-powered assistant built with Next.js 14 and the Google Gemini API. Its core differentiator is a persistent, multi-layered memory system designed to provide deep contextual understanding and continuity across conversations. The application features a dynamic chat interface, comprehensive data management hubs for contacts and knowledge entities, and integrated developer tooling for feature tracking and debugging.

The architecture is server-centric, with all AI interactions and database operations handled securely through Next.js API routes. This ensures that sensitive keys and business logic are not exposed on the client side. The system is designed to learn from user interactions by automatically processing conversations to extract and store valuable information in its structured (Vercel Postgres) and semantic (Pinecone) memory stores.

### 2. Core Technologies

The application is built on a modern, cloud-native stack:

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI/Animation:** React, Framer Motion
*   **AI Model:** Google Gemini API (`@google/genai`)
*   **Primary Database (Structured Memory):** Vercel Postgres
    *   *Stores:* Conversations, Messages, Contacts, Entities, Features, Logs, Prompts, and global Settings.
*   **Vector Database (Semantic Memory):** Pinecone
    *   *Stores:* Embeddings of free-form knowledge chunks for semantic similarity search.
*   **Deployment Platform:** Vercel

### 3. Target User

Based on its current feature set, SoulyCore is targeted at **power users, developers, and small teams**. The ideal user requires an AI assistant that goes beyond simple question-and-answer sessions and acts as a long-term knowledge partner.

Key features supporting this user profile include:
*   **Persistent Memory:** Essential for users managing long-running projects where context is critical.
*   **Contacts Hub & @mentions:** Useful for individuals who need to recall and discuss specific people in their professional network.
*   **SoulyDev Center:** A built-in feature dictionary and logging panel directly appeal to the developers building or extending the application.
*   **Prompts Hub:** Allows sophisticated users to create and manage reusable, dynamic prompt templates for complex, repeatable tasks.
