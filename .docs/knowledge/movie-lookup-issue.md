# Issue Report: Movie Poster Mismatch

**Last Updated:** 2024-07-16

### 1. Summary
There is an issue where the movie poster displayed does not always match the movie mentioned in the AI assistant's message. This appears to be a separate issue from the poster loading problem and is related to the logic used to select the best match from the TMDB API search results.

### 2. Root Cause Analysis
The root cause lies in the `execute` function of the `media_lookup` tool, located in `src/app/api/chat-tmdb-tool/route.ts`. This function contains a `selectBestMatch` helper that implements a scoring algorithm to pick the most relevant search result from TMDB.

While the algorithm is a good starting point, it has several weaknesses that can lead to incorrect selections:

-   **Ambiguity in AI Output:** The primary weakness is its dependency on the AI providing a year in its text response (e.g., "Taxi Driver (1976)"). If the AI omits the year, the scoring relies more heavily on title similarity and popularity.
-   **Popularity Bias:** The scoring adds a popularity bonus. In cases of similarly named films, a much more popular (but incorrect) film can outscore the correct, less popular one, especially if a year is not provided for disambiguation.
-   **Remakes & Adaptations:** For titles with multiple versions (e.g., "Godzilla," "King Kong"), the lack of a year in the AI's response makes it very difficult for the current logic to differentiate between them.
-   **TV vs. Movie:** The logic slightly prefers movies, but a very popular TV show could still be selected over a less popular movie with the same title.

### 3. Example Failure Scenario
1.  User asks for a niche movie from the 1980s with a common-sounding title.
2.  The AI responds with the correct title but omits the year: "You should watch 'The Thing'."
3.  The `media_lookup` tool searches TMDB for "The Thing".
4.  The search results may include John Carpenter's "The Thing" (1982) and the prequel "The Thing" (2011).
5.  If the 2011 version has a higher popularity score or other metrics that give it an edge in the algorithm, it might be incorrectly selected, and its poster will be displayed.

### 4. Recommended Next Steps (For Later)
When this issue is addressed, the `selectBestMatch` function should be made more robust. Potential improvements could include:
-   **Stricter Year Matching:** Place a much higher weight on an exact year match if one is provided.
-   **Title-First Filtering:** First, filter the results for items with an exact (or very close fuzzy match) title *before* applying popularity or other secondary scores.
-   **Prompt Engineering:** Refine the system prompt to more strongly encourage the AI to *always* include the year with a movie recommendation to improve the data quality fed into the tool. 