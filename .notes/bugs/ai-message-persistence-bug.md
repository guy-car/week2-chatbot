# AI Message Persistence Bug

**Last Updated:** 2024-07-17  
**Status:** Active - Single assistant message lost on refresh  
**Priority:** Medium (affects UX but doesn't break core functionality)

## Issue Summary

When the AI generates a response that includes tool calls (e.g., movie recommendations), the assistant's message is lost when the page is refreshed. The user's message remains, but the AI's response disappears entirely.

## Evolution of the Issue

### Phase 1: Pre-Tool/Post-Tool Redundancy (2024-07-16)
- **Observation**: AI would send two messages per tool-using turn
  - First: "Let me look that up for you" (pre-tool)
  - Second: Detailed response with tool results (post-tool)
- **Problem**: Both messages were saved, but the second message would disappear on refresh
- **Root Cause**: Message persistence logic was only saving the first part of multi-part responses

### Phase 2: Single Message Approach (2024-07-17)
- **Change**: Updated system prompt to prevent pre-tool messages
- **Result**: AI now sends only one message per tool-using turn
- **New Problem**: The single message is now lost on refresh
- **Current State**: User sees the response initially, but it disappears after page refresh

## Current Behavior

### What Works
- AI generates response with tool calls
- Response displays correctly in the UI
- Tool results are fetched and displayed
- Message appears to be saved (no immediate errors)

### What Fails
- After page refresh, the assistant's message is gone
- User's message remains intact
- Tool results are still available in the database
- No error messages in console

## Technical Investigation

### Message Structure Analysis

**Live Message (from useChat hook):**
```typescript
{
  id: 'msgs-abc123',
  role: 'assistant',
  content: 'Rocky (1976): A classic underdog story...',
  parts: [
    { type: 'step-start' },
    { type: 'tool-invocation', toolInvocation: {...} },
    { type: 'text', text: 'Rocky (1976): A classic...' }
  ],
  toolResults: [...]
}
```

**Saved Message (from database):**
```typescript
{
  id: 'msgs-abc123',
  role: 'assistant', 
  content: '', // Empty or missing
  toolResults: [...] // Present
}
```

### Database Schema
- **`messages.content`**: Text content of the message
- **`messages.toolResults`**: JSON array of tool results
- **`messages.parts`**: Not stored in database (SDK-specific)

### Save/Load Process

**Saving (`tools/chat-store.ts`):**
```typescript
await saveChat({
  id,
  messages: allMessages, // Includes assistant message with content
});
```

**Loading (`tools/chat-store.ts`):**
```typescript
const messages = await loadChat(id); // Returns messages from database
```

## Hypotheses and Investigations

### Hypothesis 1: Content Field Not Saved
- **Test**: Check if `content` field is being saved to database
- **Result**: Content appears to be saved but not loaded correctly
- **Status**: Partially confirmed

### Hypothesis 2: Message ID Conflicts
- **Observation**: Assistant message sometimes saved multiple times with same ID
- **Test**: Check for message ID reuse in save process
- **Result**: Possible cause, needs investigation

### Hypothesis 3: Database Schema Mismatch
- **Observation**: `parts` array not stored in database
- **Test**: Check if content is stored in `parts` vs `content` field
- **Result**: Content should be in `content` field, not `parts`

### Hypothesis 4: Load Function Issue
- **Observation**: Tool results load but content doesn't
- **Test**: Check `loadChat` function implementation
- **Result**: Needs investigation

## Attempts Made

### 1. Prompt Engineering (2024-07-17)
- **Attempt**: Updated system prompt to prevent pre-tool messages
- **Result**: Eliminated redundancy but didn't fix persistence
- **Status**: Successful for UX, didn't solve persistence

### 2. Message Structure Analysis
- **Attempt**: Analyzed difference between live and saved message structures
- **Result**: Identified potential issues with content field handling
- **Status**: Ongoing investigation

### 3. Logging and Debugging
- **Attempt**: Added detailed logging to track message save/load process
- **Result**: Identified that content field is empty in saved messages
- **Status**: Confirmed issue location

## Related Issues

### 1. Duplicate Message Bug (RESOLVED)
- **Connection**: Was related to pre-tool/post-tool message handling
- **Status**: Resolved via prompt engineering
- **Impact**: No longer relevant to persistence issue

### 2. Tool Call as Plain Text
- **Connection**: May be related to message structure parsing
- **Status**: Intermittent, needs investigation
- **Impact**: Could affect message content parsing

### 3. Poster Display Issues
- **Connection**: Tool results persist but content doesn't
- **Status**: Tool results work correctly
- **Impact**: Confirms tool results are saved properly

## Technical Details

### File Locations
- **`src/app/api/chat-tmdb-tool/route.ts`**: Main chat API route
- **`tools/chat-store.ts`**: Save/load functions
- **`src/server/db/schema.ts`**: Database schema
- **`src/app/_components/client/chat.tsx`**: UI rendering

### Key Functions
- **`saveChat()`**: Saves messages to database
- **`loadChat()`**: Loads messages from database
- **`appendResponseMessages()`**: Combines messages for saving

### Database Tables
- **`chats`**: Chat metadata
- **`messages`**: Individual messages with content and toolResults

## Potential Solutions

### 1. Fix Content Field Persistence
- **Approach**: Ensure `content` field is properly saved and loaded
- **Priority**: High
- **Effort**: Medium

### 2. Message ID Management
- **Approach**: Ensure unique message IDs and prevent overwriting
- **Priority**: Medium
- **Effort**: Low

### 3. Database Schema Update
- **Approach**: Store `parts` array or restructure message storage
- **Priority**: Low
- **Effort**: High

### 4. Alternative: Structured Tool Output
- **Approach**: Move to structured tool responses instead of text content
- **Priority**: Low
- **Effort**: High

## Next Steps

### Immediate (High Priority)
1. **Debug save/load process**: Add logging to track content field through save/load cycle
2. **Check message ID conflicts**: Investigate if same ID is being reused
3. **Verify database writes**: Confirm content is actually being written to database

### Medium Term
1. **Implement structured logging**: Add comprehensive logging for message lifecycle
2. **Test with different message types**: Verify if issue affects all assistant messages or just tool-using ones
3. **Consider alternative persistence**: Evaluate if current approach is fundamentally flawed

### Long Term
1. **Refactor message handling**: Consider moving to a more robust message persistence system
2. **Implement message validation**: Add checks to ensure message integrity
3. **Consider migration**: Evaluate if database schema needs updates

## References

- **Related Files**: 
  - `.docs/knowledge/chat-data-flow-state-report.md`
  - `.notes/bugs/chat-bugs.md`
- **Cross-References**: This issue is mentioned in the state report but detailed investigation is here
- **Similar Issues**: None currently identified

## Notes

- This bug affects core UX but doesn't break functionality
- Tool results persist correctly, only text content is lost
- The issue appears to be in the save/load cycle, not the AI or tool logic
- Current workaround: Users can see responses initially, but lose them on refresh 