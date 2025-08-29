
<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="SoulyCore Banner" width="1200"/>
  <h1>SoulyCore: The Cognitive AI Companion</h1>
  <p>
    <strong>A next-generation, full-stack AI assistant with a persistent, multi-faceted memory system.</strong>
  </p>
  <p>
    <a href="#-about-the-project">About</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-architecture-overview">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-project-roadmap">Roadmap</a>
  </p>
</div>

---

## 🚀 About The Project

**SoulyCore** is not just another chatbot. It's an ambitious project to build a true cognitive AI partner that learns, remembers, and evolves alongside its user. Unlike traditional stateless assistants that suffer from "digital amnesia," SoulyCore is built on a foundational principle of persistent, multi-layered memory.

This repository contains the full codebase for the SoulyCore application, a cloud-native platform designed for power users and developers who require an AI that can manage long-term projects, retain context, and become an indispensable hub for knowledge.

**The core mission:** To create an AI that moves beyond simple information retrieval to achieve genuine knowledge synthesis and proactive assistance.

---

## ✨ Key Features

*   **🧠 Multi-Layered Cognitive Architecture:** A sophisticated memory system inspired by human cognition, featuring:
    *   **Episodic Memory:** Remembers the context of past conversations.
    *   **Semantic Memory:** A vector-based knowledge base for facts and concepts.
    *   **Structured Memory:** A user-managed database for key entities like contacts and projects.
*   **💬 Dynamic Conversational UI:** A modern, responsive chat interface built with Next.js and Tailwind CSS, featuring Markdown rendering, message toolbars, and @mentions.
*   **🛠️ Integrated Power-User Tools:**
    *   **Prompts Hub:** A full CRUD interface for creating, managing, and executing reusable and dynamic prompt templates.
    *   **Contacts Hub:** A personal CRM to provide the AI with context about key people.
    *   **Memory Center:** A direct interface to view and manage the AI's learned knowledge.
*   **💻 SoulyDev Center:** An in-app control panel for developers, featuring:
    *   A live, database-driven **Features Dictionary**.
    *   A real-time, persistent **Log Output Panel** for deep debugging.
    *   (In-Progress) A **Feature Health Dashboard** for continuous testing.

---

## 🏗️ Architecture Overview

The application is built on a modern, server-centric, and scalable stack.

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Backend:** Next.js API Routes acting as a thin layer over a decoupled **Core Engine**.
*   **Core Engine (`/core`):** A dedicated, isolated module containing all business logic for the Cognitive Architecture.
*   **Databases:**
    *   **Vercel Postgres:** For all structured data (conversations, contacts, entities, etc.).
    *   **Pinecone:** For high-performance vector search (Semantic Memory).
    *   **Vercel KV (Redis):** For caching and ephemeral storage (Working Memory).
*   **AI Provider:** Google Gemini API (via an abstraction layer for future flexibility).
*   **Deployment:** Vercel

For a deep dive into the system's design, please refer to the official documentation in the [`/docs`](./docs/) directory.

---

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn
*   A Vercel account with Postgres, Pinecone, and KV databases set up.
*   A Google Gemini API Key.

### Installation & Setup

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/onooinc-code/SoulyCore.git
    cd SoulyCore
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a file named `.env.local` in the project root.
    *   Copy the contents of `.env.example` into your new file.
    *   Fill in the required values for your Vercel database connections and your `GEMINI_API_KEY`.

4.  **Initialize the database:**
    *   The `postinstall` script usually handles this, but you can run it manually to ensure your database schema is up-to-date.
    ```sh
    npm run db:create
    npm run db:seed
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## 🗺️ Project Roadmap

We are currently in the middle of a major architectural refactor to implement the **Cognitive Architecture v2.0**. The complete, step-by-step implementation plan is being tracked in our project's task documentation.

*   **Master Plan:** [`/project_tasks/00_Master_Plan.md`](./project_tasks/00_Master_Plan.md)
*   **Detailed Tasks:** [`/project_tasks/tasks/`](./project_tasks/tasks/)

This ensures full transparency on the project's progress and what's coming next.

---
