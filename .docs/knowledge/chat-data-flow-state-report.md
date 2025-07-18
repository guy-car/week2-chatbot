# State Report: Chat & Movie Recommendation Data Flow

**Last Updated:** 2024-07-17

### 1. Overview
This document outlines the end-to-end data flow for the chat feature, from message creation to displaying AI-recommended movie posters. It details how user messages are processed, how the AI fetches movie data via a tool, and how that data is persisted to the database and reloaded into the UI.

### 2. Key Components & File Paths
-   **`src/app/_components/client/chat.tsx`**: The main React component for the chat interface. It handles message display, user input, and the logic for displaying movie posters from both live and database-loaded messages.
-   **`src/app/api/chat-tmdb-tool/route.ts`**: The core API route that receives user messages, interacts with the OpenAI API, and executes the `media_lookup` tool to fetch data from TMDB.
-   **`tools/chat-store.ts`**: A server-side utility that handles all database interactions for chats. It includes functions for creating chats, saving messages with their `toolResults`, and loading the chat history.
-   **`src/server/db/schema.ts`**: Defines the database schema, specifically the `chats` and `messages` tables. The `messages.toolResults` column (`jsonb`) is critical as it stores the movie data fetched from the TMDB API.

### 3. Implementation Details & Quirks (Updated 2024-07-17)
- **Asynchronous Data Loading**: When a chat is loaded, the message content (`loadChat`) and the associated movie poster data (`loadMoviesForChat`) are fetched in two separate asynchronous calls. The client-side logic in `chat.tsx` is responsible for correctly combining this data to display posters.
- **Data Structure Discrepancy**: A "live" message from the `useChat` hook contains movie data within the `message.parts` array as a `tool-invocation`. A message loaded from the database does *not* have this structure; its movie data is stored in the `toolResults` column and must be accessed via the `savedMovies` map in the `Chat` component. This distinction is the primary source of complexity.
- **Poster Display Logic**: The component is designed to display the 3 most recent movie posters from the *entire* conversation, not just the last message. It achieves this by iterating through all messages, collecting all associated movies (from both live and saved sources), sorting them by timestamp, and then rendering the top three.
- **Message Update Handling (2024-07-17)**: The system now properly handles both new messages and updates to existing messages. When the AI SDK generates tool calls followed by text content, the `saveChat` function separates new messages from existing ones that need updates, ensuring both tool results and text content persist correctly after page refresh.
- **Tool Results Persistence**: Tool results (movie data) persist correctly in the database, and the assistant's text content now also persists correctly after the implementation of proper update handling.

### 4. Dependencies
-   **`@ai-sdk/react`**: Provides the `useChat` hook for managing client-side chat state and interactions.
-   **`@ai-sdk/openai`**: Used on the server to interact with the OpenAI API.
-   **`drizzle-orm`**: The ORM used for all database interactions with the Postgres database.
-   **The Movie Database (TMDB)**: The external API service used by the `media_lookup` tool to fetch movie details and poster URLs.

### 5. Configuration
-   **`OPENAI_API_KEY`**: API key for OpenAI, necessary for the AI model to generate responses.
-   **`TMDB_API_KEY`**: API key for TMDB, required for the `media_lookup` tool to function.
-   **`DATABASE_URL`**: The connection string for the project's Postgres database.

### 6. Known Issues
- **UI Text Rendering**: Double newlines in AI responses are not rendered as paragraph breaks in the frontend, even though the AI outputs them correctly.
- **AI Message Persistence**: ~~The assistant's message content is lost on page refresh, though tool results persist correctly. This is documented in detail in `.notes/bugs/ai-message-persistence-bug.md`.~~ **RESOLVED (2024-07-17)**: Implemented proper message update handling in `saveChat` function to handle both new messages and updates to existing messages.
- **Sidebar Cache Invalidation**: Newly created chats don't appear in the sidebar's recent chat list until the page is refreshed. This is documented in detail in `.docs/knowledge/sidebar-cache-invalidation-patterns.md`.

### 7. Cache Invalidation Patterns (2024-07-17)
- **Chat Creation**: Requires cache invalidation of `chat.getAll` to update sidebar immediately
- **Chat Title Updates**: Requires cache invalidation of `chat.getAll` when first user message sets the title
- **Server-Client Integration**: Server components (sidebar) and client components (chat creation) share the same tRPC cache
- **Mutation Pattern**: All chat mutations should include `onSuccess: () => { void utils.chat.getAll.invalidate(); }`

### 8. Diagrams (Optional)
A Mermaid diagram would be beneficial here to visualize the complex data flow between the client, server, AI service, and database, especially the two-pronged data loading process on the client. 