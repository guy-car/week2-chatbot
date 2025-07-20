# Chat Bugs & UX Issues Investigation

**Last Updated:** 2024-07-17

This document tracks various bugs and unexpected behaviors discovered during chat interactions.

---

### 1. Inconsistent Movie Poster Fetching
-   **Observation:** Movie posters sometimes fail to display even when the AI recommends a movie.
-   **Hypothesis:** The AI does not consistently call the `media_lookup` tool. This is influenced by the AI's response generation, specifically when it uses markdown around titles or adopts a "tentative" conversational tone.
-   **Status:** **RESOLVED.** After reinforcing the system prompt to be more strict and forbid markdown, the tool call is now much more reliable. The issue is not completely eliminated but is significantly less frequent.

---

### 2. AI Message Persistence Issue
-   **Observation:** When the AI gives a response with tool calls, the assistant's message is lost on page refresh.
-   **Current State:** ~~The single assistant message disappears after refresh, though tool results persist correctly.~~ **RESOLVED (2024-07-17)**: Implemented proper message update handling in `saveChat` function.
-   **Status:** ~~**ACTIVE.** This is now a primary issue with detailed investigation ongoing.~~ **RESOLVED**: The system now properly handles both new messages and updates to existing messages, ensuring both tool results and text content persist correctly.
-   **Reference:** See `.notes/bugs/ai-message-persistence-bug.md` for comprehensive documentation, technical investigation **implemented solution**.

---

### 3. Duplicate Movie Recommendations & Posters
-   **Observation:** The AI assistant has recommended the same movie multiple times within the same conversation. This leads to duplicate movie posters being displayed in the UI.
-   **Hypothesis:** The AI's context window or instruction following is failing. The prompt tells it "do not recommend the same movie twice," but this is being ignored. The front-end logic for displaying posters also seems to not de-duplicate movies.
-   **Status:** **RESOLVED.** Updated system prompt now enforces maximum 3 recommendations and better formatting rules.

---

### 4. Poster Display Limit Exceeded
-   **Observation:** The UI displayed four movie posters, but the intended maximum is three.
-   **Hypothesis:** The client-side rendering logic in `chat.tsx` that calculates `latestMovies` is flawed, likely due to how it handles multiple tool results or duplicates in a single turn.
-   **Status:** **RESOLVED.** System prompt now enforces maximum 3 recommendations, preventing this issue.

---

### 5. Poster Count Corrects on Refresh
-   **Observation:** When a chat displays more than the maximum of 3 posters (e.g., 4), refreshing the page correctly reduces the displayed poster count to 3.
-   **Hypothesis:** This is a symptom of the client-side logic being different for live vs. saved data. The refresh forces a clean load from the database, which seems to be handled more correctly.
-   **Status:** **RESOLVED.** No longer occurs due to prompt improvements limiting recommendations to 3 maximum.

---

### 6. Inconsistent AI Response Structure (One-Part vs. Two-Part)
-   **Observation:** The AI's response format is inconsistent.
-   **Hypothesis:** This is directly tied to tool usage. The more reliable tool usage has made the two-part response more common. The remaining inconsistency is now linked to the "Disappearing AI Message" bug, as the final saved state doesn't reflect the live state.
-   **Status:** **RESOLVED.** System now consistently emits single assistant messages per tool-using turn.

---

### 7. Tool Call Included as Plain Text (Weird Formatting)
-   **Observation:** In some cases, the AI's response includes the tool call (e.g., `media_lookup({title: "Black Hawk Down"})`) as plain text within the message, rather than as a structured tool-invocation part.
-   **Hypothesis:** This may be due to prompt/AI configuration issues or a bug in how tool calls are parsed and structured before being sent to the backend.
-   **Status:** **IMPROVED.** Stricter prompt engineering has reduced this issue, but it may still occur intermittently.

---

### 8. Assistant Message ID Reuse/Overwriting
-   **Observation:** The assistant's message is sometimes saved multiple times with the same id, but with different content and parts. This results in only the last version being persisted in the database, potentially causing earlier parts of a multi-part message to be lost.
-   **Hypothesis:** The backend or client may be reusing the same message id for both the pre-tool and post-tool-call parts of the assistant's response, leading to overwriting in the database.
-   **Status:** **RESOLVED.** Single message approach eliminates this issue, though message persistence remains a problem (see item #2).

---

### 9. UI Text Rendering Issue
-   **Observation:** AI responses with double newlines (intended as paragraph breaks) are rendered as single paragraphs in the UI.
-   **Hypothesis:** The frontend is not properly converting `\n\n` sequences to paragraph breaks or proper spacing.
-   **Status:** **NEW FEATURE REQUEST.** This is a UI enhancement needed to properly render the AI's formatted responses. 


___


Me:
Why is the LEftovers such a good show?
Genie
The Leftovers (2014): This gripping drama explores the emotional aftermath of a mysterious event where 2% of the world's population suddenly vanishes. It delves into the lives and struggles of those left behind, offering intense performances and profound storytelling that keep viewers captivated.
Me:
yes but why is it so good?
Genie
The Leftovers (2014): This show is celebrated for its unique premise, exploring deep emotional and philosophical themes through the lens of a community grappling with unexplained loss. Its strong character development, coupled with haunting performances and a mysterious narrative, makes it a compelling and thought-provoking series.