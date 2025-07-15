# Chat Bugs & UX Issues Investigation

**Last Updated:** 2024-07-17

This document tracks various bugs and unexpected behaviors discovered during chat interactions.

---

### 1. Inconsistent Movie Poster Fetching
-   **Observation:** Movie posters sometimes fail to display even when the AI recommends a movie.
-   **Hypothesis:** The AI does not consistently call the `media_lookup` tool. This is influenced by the AI's response generation, specifically when it uses markdown around titles or adopts a "tentative" conversational tone.
-   **Status:** **Improved.** After reinforcing the system prompt to be more strict and forbid markdown, the tool call is now much more reliable. The issue is not completely eliminated but is significantly less frequent.

---

### 2. Disappearing AI Message on Refresh
-   **Observation:** When the AI gives a two-part response, both parts are visible initially. However, upon refreshing the page, the second part of the message disappears, leaving only the initial sentence.
-   **Hypothesis:** This is a data persistence bug. When `saveChat` is called, it appears to only be saving the *first* text part of a multi-part AI response to the database `content` field. The subsequent parts of the message are being discarded and are therefore missing when the chat is reloaded from the database.
-   **Status:** **Newly Discovered.** This is now a primary issue to investigate, likely within the `saveChat` function in `tools/chat-store.ts`.

---

### 3. Duplicate Movie Recommendations & Posters
-   **Observation:** The AI assistant has recommended the same movie multiple times within the same conversation. This leads to duplicate movie posters being displayed in the UI.
-   **Hypothesis:** The AI's context window or instruction following is failing. The prompt tells it "do not recommend the same movie twice," but this is being ignored. The front-end logic for displaying posters also seems to not de-duplicate movies.
-   **Status:** Documented. Needs further investigation.

---

### 4. Poster Display Limit Exceeded
-   **Observation:** The UI displayed four movie posters, but the intended maximum is three.
-   **Hypothesis:** The client-side rendering logic in `chat.tsx` that calculates `latestMovies` is flawed, likely due to how it handles multiple tool results or duplicates in a single turn.
-   **Status:** Documented. Needs further investigation.

---

### 5. Poster Count Corrects on Refresh
-   **Observation:** When a chat displays more than the maximum of 3 posters (e.g., 4), refreshing the page correctly reduces the displayed poster count to 3.
-   **Hypothesis:** This is a symptom of the client-side logic being different for live vs. saved data. The refresh forces a clean load from the database, which seems to be handled more correctly.
-   **Status:** Documented.

---

### 6. Inconsistent AI Response Structure (One-Part vs. Two-Part)
-   **Observation:** The AI's response format is inconsistent.
-   **Hypothesis:** This is directly tied to tool usage. The more reliable tool usage has made the two-part response more common. The remaining inconsistency is now linked to the "Disappearing AI Message" bug, as the final saved state doesn't reflect the live state.
-   **Status:** This is a symptom of other root causes. 