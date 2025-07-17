# AI SDK Message Persistence Patterns

**Last Updated:** 2024-07-17

## Overview

This document outlines the message persistence patterns used by the Vercel AI SDK and how our application handles them. Understanding these patterns is crucial for implementing robust chat persistence.

## AI SDK Message Lifecycle

### Tool-Using Response Pattern

When the AI generates a response that includes tool calls, the AI SDK follows a specific two-request pattern:

1. **First Request**: Tool calls only
   - Message contains tool invocations in `parts` array
   - `content` field is typically empty
   - Message ID is generated for the initial structure

2. **Second Request**: Text content
   - Same message ID as first request
   - `content` field contains the actual text response
   - May include updated `parts` array with both tool calls and text

### Example Flow

```typescript
// First request - tool calls only
{
  id: 'msgs-abc123',
  role: 'assistant',
  content: '',
  parts: [
    { type: 'step-start' },
    { type: 'tool-invocation', toolInvocation: {...} },
    { type: 'tool-invocation', toolInvocation: {...} }
  ]
}

// Second request - same ID, now with content
{
  id: 'msgs-abc123', // Same ID!
  role: 'assistant',
  content: 'Here are some great movies...',
  parts: [
    { type: 'step-start' },
    { type: 'tool-invocation', toolInvocation: {...} },
    { type: 'text', text: 'Here are some great movies...' }
  ]
}
```

## Implementation Requirements

### Database Schema

The database must support updates to existing messages:

```typescript
export const messages = createTable("messages", {
  id: text('id').primaryKey(),           // Enables precise updates
  chatId: text('chat_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  content: text('content').notNull(),    // Can be updated
  toolResults: jsonb('tool_results'),    // Can be updated
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
```

### Persistence Logic

The `saveChat` function must handle both scenarios:

```typescript
// Separate new vs existing messages
const newMessages = messageList.filter(msg => !existingIds.has(msg.id));
const updateMessages = messageList.filter(msg => existingIds.has(msg.id));

// Insert new messages
if (newMessages.length > 0) {
  await db.insert(messages).values(/* ... */);
}

// Update existing messages
if (updateMessages.length > 0) {
  for (const msg of updateMessages) {
    await db.update(messages)
      .set({ content: msg.content, toolResults: extractToolResults(msg) })
      .where(eq(messages.id, msg.id));
  }
}
```

## Common Pitfalls

### 1. Filtering Out Updates

**Problem**: Only handling new messages
```typescript
// WRONG - filters out existing messages that need updates
const newMessages = messageList.filter(msg => !existingIds.has(msg.id));
```

**Solution**: Handle both new and update scenarios
```typescript
// CORRECT - separate new vs update messages
const newMessages = messageList.filter(msg => !existingIds.has(msg.id));
const updateMessages = messageList.filter(msg => existingIds.has(msg.id));
```

### 2. Content Extraction

**Problem**: Not extracting text from `parts` array
```typescript
// WRONG - may miss content in parts
content: msg.content
```

**Solution**: Extract text from parts when available
```typescript
// CORRECT - handle both content and parts
let content = msg.content;
if (msg.role === 'assistant' && Array.isArray((msg as any).parts)) {
  const textParts = (msg as any).parts
    .filter((p: any) => p.type === 'text')
    .map((p: any) => p.text);
  content = textParts.join('\n').trim() || msg.content;
}
```

### 3. Error Handling

**Problem**: Single failure breaks entire operation
```typescript
// WRONG - one failure stops everything
await Promise.all(updates);
```

**Solution**: Handle failures gracefully
```typescript
// CORRECT - continue on individual failures
for (const msg of updateMessages) {
  try {
    await db.update(messages).set({...}).where(eq(messages.id, msg.id));
  } catch (error) {
    console.error('Failed to update message:', msg.id, error);
    // Continue with other updates
  }
}
```

## Testing Strategies

### 1. Tool-Calling Scenarios

Test with AI responses that include tool calls:
- Verify both tool results and text content persist
- Check that updates work correctly
- Ensure no duplicate messages are created

### 2. Non-Tool-Calling Scenarios

Test with simple chat responses:
- Verify normal chat functionality still works
- Ensure no regression in basic message handling
- Check that simple messages are saved correctly

### 3. Concurrent Scenarios

Test rapid message sending:
- Verify no race conditions occur
- Check that all messages are saved correctly
- Ensure no data loss under load

## Monitoring and Debugging

### Key Logs to Monitor

```typescript
// Track message separation
console.log('New messages:', newMessages.length);
console.log('Update messages:', updateMessages.length);

// Track update success
console.log('Successfully updated message:', msg.id);

// Track failures
console.error('Failed to update message:', msg.id, error);
```

### Database Queries for Debugging

```sql
-- Check message content after updates
SELECT id, role, content, tool_results 
FROM messages 
WHERE chat_id = 'your-chat-id' 
ORDER BY created_at;

-- Check for empty content
SELECT id, role, content 
FROM messages 
WHERE content = '' OR content IS NULL;
```

## Best Practices

1. **Always handle both new and update scenarios**
2. **Extract content from parts array when available**
3. **Use database transactions for atomicity**
4. **Implement comprehensive error handling**
5. **Add detailed logging for debugging**
6. **Test both tool-calling and non-tool-calling scenarios**
7. **Monitor for race conditions in concurrent scenarios**

## Related Documentation

- `.docs/knowledge/chat-data-flow-state-report.md` - Overall chat data flow
- `.notes/bugs/ai-message-persistence-bug.md` - Detailed bug investigation
- `tools/chat-store.ts` - Implementation of persistence logic 