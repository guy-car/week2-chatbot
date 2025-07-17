# TMDB Movie Lookup System

**Last Updated:** 2024-07-17

## Overview

The TMDB Movie Lookup System is a robust, year-aware tool that fetches movie and TV show data from The Movie Database (TMDB) API. It provides accurate poster matching, handles ambiguous titles, and supports both movies and TV shows with proper disambiguation.

## Architecture

### Core Components

- **`src/app/api/chat-tmdb-tool/route.ts`**: Main API route that handles chat requests and executes the `media_lookup` tool
- **`media_lookup` Tool**: AI tool that accepts `title` (required) and `year` (optional) parameters
- **TMDB API Integration**: Uses multiple endpoints for optimal search results

### Tool Schema

```typescript
media_lookup: {
  description: 'MANDATORY: Call this for every movie/TV show/documentary you recommend by name. You MUST provide both the exact title and the year of release as separate parameters whenever possible.',
  parameters: z.object({
    title: z.string().describe('The exact title as written in your response'),
    year: z.number().describe('The year of release (e.g., 2015). REQUIRED for new logic, but optional for backward compatibility.').optional(),
  })
}
```

## Search Strategy

### Multi-Endpoint Approach

The system uses a sophisticated search strategy to maximize accuracy:

1. **Primary Search**: Attempts both movie and TV endpoints simultaneously
   - `/search/movie?query=...&year=...` (when year provided)
   - `/search/tv?query=...&first_air_date_year=...` (when year provided)
   - Falls back to endpoints without year if year not provided

2. **Fallback Search**: If both movie and TV searches return no results, uses `/search/multi` as a last resort

3. **Result Aggregation**: Combines results from all endpoints for comprehensive scoring

### Endpoint Selection Logic

```typescript
// Movie search with year
const movieParams = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
if (year) movieParams.year = year;

// TV search with year  
const tvParams = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
if (year) tvParams.first_air_date_year = year;

// Multi search fallback
const multiParams = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
```

## Scoring Algorithm

### Scoring Components

The system uses a weighted scoring algorithm to select the best match:

- **Exact Title Match**: +50 points (case-insensitive)
- **Partial Title Match**: +20 points (if title contains search term)
- **Exact Year Match**: +60 points (when year is provided and matches)
- **Year Difference Penalty**: -2 points per year difference
- **Popularity Bonus**: +0 to +10 points (capped at 10)
- **Media Type Preference**: +5 points for movies over TV shows

### Scoring Logic

```typescript
let score = 0;
const itemTitle = (item.title ?? item.name ?? '').toLowerCase();
const itemYear = parseInt(item.release_date?.substring(0, 4) ?? item.first_air_date?.substring(0, 4) ?? '0');

// Exact title match
if (itemTitle === cleanTitle) score += 50;
// Partial title match  
else if (itemTitle.includes(cleanTitle)) score += 20;

// Year matching
if (year && itemYear) {
  if (itemYear === year) score += 60;
  else score -= Math.abs(itemYear - year) * 2;
}

// Popularity bonus (capped)
score += Math.min(item.popularity / 100, 10);

// Prefer movies over TV
if (item.media_type === 'movie') score += 5;
```

### Result Selection

- All results are scored and sorted by score (descending)
- The highest-scoring result is selected
- Early exit for perfect matches (exact title + exact year)

## Year Parameter Handling

### Importance of Year

The year parameter is crucial for disambiguation:

- **When Provided**: Significantly improves accuracy, especially for remakes and common titles
- **When Missing**: System falls back to title matching and popularity, which can be less accurate
- **Backward Compatibility**: Year is optional to maintain compatibility with existing prompts

### Year Extraction

The system can extract years from titles if the AI includes them:
```typescript
const yearMatch = /\((\d{4})\)/.exec(title);
const searchYear = yearMatch?.[1] ? parseInt(yearMatch[1]) : null;
const cleanTitle = title.replace(/\s*\(\d{4}\)/, '').trim();
```

## Media Type Support

### Movies vs TV Shows

- **Movies**: Use `/search/movie` endpoint with `year` parameter
- **TV Shows**: Use `/search/tv` endpoint with `first_air_date_year` parameter
- **Automatic Detection**: System searches both types and selects the best match
- **Preference**: Movies are slightly preferred (+5 points) for ambiguous searches

### Result Structure

```typescript
{
  id: number,
  title: string,
  poster_url: string | null,
  release_date: string,
  rating: number,
  overview: string,
  media_type: 'movie' | 'tv'
}
```

## Error Handling

### Graceful Degradation

- **No Results**: Returns `{ error: 'No results found' }`
- **API Errors**: Returns `{ error: 'Failed to fetch movie data' }`
- **Invalid API Key**: Throws error with clear message
- **Network Issues**: Handled with try-catch blocks

### Fallback Strategy

1. Try movie and TV endpoints with year
2. Try movie and TV endpoints without year
3. Try multi search as last resort
4. Return error if no results found

## Performance Considerations

### API Efficiency

- **Parallel Requests**: Movie and TV searches run simultaneously
- **Caching**: TMDB API responses are not cached (consider implementing)
- **Rate Limiting**: Respects TMDB API rate limits
- **Timeout**: 30-second maximum duration for streaming responses

### Optimization Opportunities

- **Result Caching**: Cache TMDB responses to reduce API calls
- **Batch Processing**: Consider batching multiple lookups
- **Connection Pooling**: Optimize HTTP connection reuse

## Current Limitations

### Known Edge Cases

1. **Same Title, Same Year**: If a movie and TV show have the same title and year, the movie will be preferred
2. **Missing Year**: Without year, accuracy depends on title uniqueness and popularity
3. **International Titles**: May not handle non-English titles optimally
4. **Very Recent Releases**: New releases may not be in TMDB database immediately

### Ambiguous Scenarios

- **Remakes**: "The Thing" (1982) vs "The Thing" (2011) - year is crucial
- **Common Titles**: "Rocky" (multiple versions) - year disambiguation essential
- **TV vs Movie**: "The Office" (US TV) vs "The Office" (UK TV) - context dependent

## Integration with AI

### Prompt Engineering

The system prompt strongly encourages the AI to:
- Always provide the year when known
- Use exact titles (no markdown formatting)
- Call the tool for every recommendation
- Limit to 3 recommendations maximum

### Tool Call Protocol

```typescript
// Correct usage
media_lookup({title: "Rocky", year: 1976})

// Backward compatible
media_lookup({title: "Rocky"})
```

## Monitoring and Debugging

### Logging

The system provides detailed logging for debugging:
- Tool call confirmations with parameters
- TMDB endpoint URLs and parameters
- Scoring breakdown for each candidate
- Final selection with reasoning

### Example Log Output

```
[TOOL_CALL_CONFIRMATION] media_lookup tool was called for title: "Rocky", year: 1976
[TMDB_FETCH] MOVIE endpoint: https://api.themoviedb.org/3/search/movie?query=Rocky&year=1976
📊 rocky (1976) [movie]: score=115.099356 [exact title match +50, exact year match +60, popularity +0.10, movie bonus +5]
✅ FINAL PICK: rocky (1976) [movie] with score 115.099356
```

## Future Improvements

### Potential Enhancements

1. **Fuzzy Matching**: Implement more sophisticated title matching algorithms
2. **Genre Filtering**: Add genre-based scoring for better context
3. **User Preferences**: Consider user's watch history for personalized scoring
4. **Caching Layer**: Implement response caching to improve performance
5. **Internationalization**: Better support for non-English titles and releases

### API Enhancements

1. **Batch Endpoints**: Use TMDB batch endpoints for multiple lookups
2. **Advanced Search**: Leverage TMDB's advanced search features
3. **Alternative Titles**: Search across alternative titles and translations

## Configuration

### Environment Variables

- **`TMDB_API_KEY`**: Required for API access
- **`maxDuration`**: Set to 30 seconds for streaming responses

### Dependencies

- **`@ai-sdk/openai`**: For AI model integration
- **`zod`**: For parameter validation
- **`fetch`**: For HTTP requests to TMDB API

## Conclusion

The TMDB Movie Lookup System provides robust, year-aware movie and TV show matching with sophisticated scoring algorithms and graceful error handling. While some edge cases remain, the system significantly improves upon the previous implementation and provides reliable poster matching for most use cases. 