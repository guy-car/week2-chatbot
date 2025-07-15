# State Report: Chat & Movie Recommendation Data Flow

**Last Updated:** 2024-07-16

### 1. Overview
This document outlines the end-to-end data flow for the chat feature, from message creation to displaying AI-recommended movie posters. It details how user messages are processed, how the AI fetches movie data via a tool, and how that data is persisted to the database and reloaded into the UI.

### 2. Key Components & File Paths
-   **`src/app/_components/client/chat.tsx`**: The main React component for the chat interface. It handles message display, user input, and the logic for displaying movie posters from both live and database-loaded messages.
-   **`src/app/api/chat-tmdb-tool/route.ts`**: The core API route that receives user messages, interacts with the OpenAI API, and executes the `media_lookup` tool to fetch data from TMDB.
-   **`tools/chat-store.ts`**: A server-side utility that handles all database interactions for chats. It includes functions for creating chats, saving messages with their `toolResults`, and loading the chat history.
-   **`src/server/db/schema.ts`**: Defines the database schema, specifically the `chats` and `messages` tables. The `messages.toolResults` column (`jsonb`) is critical as it stores the movie data fetched from the TMDB API.

### 3. Implementation Details & Quirks
-   **Asynchronous Data Loading**: When a chat is loaded, the message content (`loadChat`) and the associated movie poster data (`loadMoviesForChat`) are fetched in two separate asynchronous calls. The client-side logic in `chat.tsx` is responsible for correctly combining this data to display posters.
-   **Data Structure Discrepancy**: A "live" message from the `useChat` hook contains movie data within the `message.parts` array as a `tool-invocation`. A message loaded from the database does *not* have this structure; its movie data is stored in the `toolResults` column and must be accessed via the `savedMovies` map in the `Chat` component. This distinction is the primary source of complexity.
-   **Poster Display Logic**: The component is designed to display the 3 most recent movie posters from the *entire* conversation, not just the last message. It achieves this by iterating through all messages, collecting all associated movies (from both live and saved sources), sorting them by timestamp, and then rendering the top three.

### 4. Dependencies
-   **`@ai-sdk/react`**: Provides the `useChat` hook for managing client-side chat state and interactions.
-   **`@ai-sdk/openai`**: Used on the server to interact with the OpenAI API.
-   **`drizzle-orm`**: The ORM used for all database interactions with the Postgres database.
-   **The Movie Database (TMDB)**: The external API service used by the `media_lookup` tool to fetch movie details and poster URLs.

### 5. Configuration
-   **`OPENAI_API_KEY`**: API key for OpenAI, necessary for the AI model to generate responses.
-   **`TMDB_API_KEY`**: API key for TMDB, required for the `media_lookup` tool to function.
-   **`DATABASE_URL`**: The connection string for the project's Postgres database.

### 6. Diagrams (Optional)
A Mermaid diagram would be beneficial here to visualize the complex data flow between the client, server, AI service, and database, especially the two-pronged data loading process on the client. 