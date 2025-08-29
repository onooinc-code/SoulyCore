# Feature Registry: API Endpoints

This document lists the planned API development work, including refactoring existing endpoints and creating new ones to support the v2 Cognitive Architecture.

| Feature                               | Description                                                                                                    | Key UI/UX Considerations                                      |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| **Refactor `/api/chat` Endpoint**     | Rewrite the primary chat endpoint to delegate all business logic to the new `Context Assembly Pipeline`.         | Existing chat functionality should remain seamless to the user. |
| **Refactor `/api/memory/pipeline` Endpoint** | Rewrite the memory processing endpoint to delegate all logic to the new `Memory Extraction Pipeline`.      | Memory processing will become a background task, improving UI responsiveness. |
| **New Brain Management Endpoints**    | Create a new set of CRUD API endpoints to manage Brain configurations, supporting the Brain Center UI.         | Enables the "Brain Management Tab" to function.               |
| **New Memory Viewer Endpoints**       | Create new read-only API endpoints that allow the Brain Center UI to query the contents of each SMM for inspection. | Enables the "Memory Module Viewer" to display data.           |
