
# SoulyCore: Frontend Architecture (As-Is)

**Document Version:** 1.0
**Status:** Baseline (Current Implementation)

---

### 1. Component Breakdown

The frontend is structured using a modular component system, primarily located in the `components/` directory.

*   **`App.tsx`**: The main client-side entry point that orchestrates the entire UI. It manages the layout, houses the global context menu logic, and controls the visibility of all major modals (Contacts Hub, Memory Center, etc.).

*   **`Sidebar.tsx`**: The primary navigation component. It displays the list of conversations (grouped by recency), provides search functionality, and contains entry points to all major application hubs and settings.

*   **`ChatWindow.tsx`**: The central view of the application. It is responsible for rendering the list of `Message` components, displaying the `Header`, managing the `ChatInput`, and showing status information via the `StatusBar`.

*   **`Header.tsx`**: A dedicated component at the top of the chat view that displays the current conversation's title and provides conversation-specific actions (edit title, delete, generate title) and global UI controls (toggle sidebar/logs, change font size).

*   **`Message.tsx`**: Renders a single user or model message. It handles the display of markdown content and contains the `MessageToolbar`, which provides actions like copy, bookmark, summarize, and regenerate.

*   **`ChatInput.tsx`**: The user input component. It manages text entry, file (image) attachments, the pop-up list for `@mentioning` contacts, and the launcher for the Prompts Hub.

*   **Hub Modals (`ContactsHub.tsx`, `MemoryCenter.tsx`, `PromptsHub.tsx`, etc.)**: Each of these is a large, self-contained component that provides a full-fledged interface (CRUD operations, search, filtering) for a specific data model. They are loaded dynamically to improve initial page load performance.

### 2. State Management Strategy

SoulyCore employs the React Context API with a provider pattern to manage global application state, avoiding the need for a more complex state management library.

*   **`AppProvider.tsx`**: This is the most critical provider. It serves as the client-side "single source of truth" for all conversational and session data.
    *   **Responsibilities:**
        *   Manages state for `conversations`, `currentConversation`, and `messages`.
        *   Contains all client-side logic for fetching and mutating data via API calls (e.g., `addMessage`, `loadConversations`, `deleteConversation`).
        *   Tracks global `isLoading` and `status` (error messages, current actions).
        *   Handles global `settings` state.

*   **`LogProvider.tsx`**: A dedicated provider for the developer log panel.
    *   **Responsibilities:**
        *   Manages the `logs` array state.
        *   Provides functions to `log` new entries (which posts to the database) and `clearLogs`.
        *   Controls whether logging is active based on the global settings.

### 3. Key UI Interaction Flow: Sending a Message

1.  **User Input**: The user types a message in the `ChatInput` component, optionally attaching an image or using an `@mention`. They press Enter or click the send button.
2.  **Event Trigger**: The `onSubmit` handler in `ChatInput` is called. It packages the final message content (including image data URI if present) and mentioned contacts into a payload.
3.  **Call to `ChatWindow`**: `ChatInput` calls the `onSendMessage` function passed down from `ChatWindow`.
4.  **Call to `AppProvider`**: `ChatWindow` calls the `addMessage` function from the `useAppContext` hook.
5.  **Optimistic UI Update**: Inside `AppProvider`, an "optimistic" user message object is created with a temporary ID and immediately added to the `messages` state array. This makes the user's message appear in the UI instantly.
6.  **Save User Message**: `AppProvider` makes a `POST` request to `/api/conversations/[id]/messages` to save the user's message to the database.
7.  **Get AI Response**: `AppProvider` then makes a `POST` request to the core `/api/chat` endpoint, sending the full message history, conversation settings, and any contextual data (like mentioned contacts). The UI enters a loading state.
8.  **Update with AI Response**: Upon receiving a successful response from `/api/chat`, `AppProvider` takes the AI-generated text and saves it as a new "model" message via another `POST` to `/api/conversations/[id]/messages`.
9.  **Final UI Update**: The newly saved AI message (with its permanent ID from the database) is added to the `messages` state, causing it to render in the `ChatWindow`.
10. **Trigger Memory Pipeline**: As a final, non-blocking step, `AppProvider` makes an asynchronous `POST` request to `/api/memory/pipeline`, sending the user's message and the AI's response to be analyzed and learned from in the background.
