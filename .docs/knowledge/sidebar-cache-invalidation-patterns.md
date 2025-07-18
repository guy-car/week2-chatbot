# State Report: Sidebar Cache Invalidation Patterns

**Last Updated:** 2024-07-17

### 1. Overview

This document describes the cache invalidation patterns and architectural considerations discovered during the investigation of the sidebar chat list update issue. It provides essential context for implementing chat management features (create, update, delete, rename) and understanding the client-server data flow.

### 2. Key Components & File Paths

-   **Server Component (`src/app/_components/server/AppSidebar.tsx`):**
    -   Renders on the server and fetches chat data using `api.chat.getAll()` at build/render time
    -   Displays chat titles as `{chat.title ?? formatChatDate(chat.createdAt)}`
    -   **Critical Insight:** Server components don't automatically re-render when client-side data changes

-   **Client Components with Chat Creation:**
    -   **`src/app/_components/client/NewChatComponent.tsx`:** Creates chats from homepage
    -   **`src/app/_components/client/chat.tsx`:** Creates chats from within existing chats
    -   Both use `api.chat.create.useMutation()` without cache invalidation

-   **Chat Title Management (`src/app/_hooks/useChatTitle.ts`):**
    -   Client-side hook that updates chat titles when first user message is sent
    -   Uses `api.chat.updateTitle.useMutation()` without cache invalidation
    -   **Critical Insight:** Title updates happen after chat creation, requiring separate cache invalidation

-   **Server-Side Title Updates (`src/app/api/chat-tmdb-tool/route.ts`):**
    -   Also updates chat titles server-side when first user message is processed
    -   Uses `api.chat.updateTitle()` directly (server-side tRPC call)

### 3. Implementation Details & Quirks

-   **Chat Title Flow:**
    -   **Creation:** New chat created with `null` title (no default date title)
    -   **First Message:** Title set to first 40 characters of user's first message
    -   **Display:** Sidebar shows `title ?? formattedDate` (date fallback for untitled chats)

-   **Cache Invalidation Requirements:**
    -   **Chat Creation:** Must invalidate `chat.getAll` cache to show new chat in sidebar
    -   **Title Updates:** Must invalidate `chat.getAll` cache to show updated title in sidebar
    -   **Future Operations:** Rename/delete will require similar cache invalidation

-   **Server vs Client tRPC:**
    -   **Server Components:** Use `api.chat.getAll()` (server-side tRPC)
    -   **Client Components:** Use `api.chat.create.useMutation()` (client-side tRPC)
    -   **Critical Insight:** Server and client tRPC share the same cache, so client-side invalidation affects server-side data

-   **Mutation Patterns:**
    ```typescript
    // Required pattern for chat mutations
    const utils = api.useUtils();
    const mutation = api.chat.someOperation.useMutation({
      onSuccess: () => {
        void utils.chat.getAll.invalidate();
      },
    });
    ```

### 4. Dependencies

-   **tRPC React Query Integration:** Client-side mutations can invalidate server-side query cache
-   **Next.js Server Components:** Server components render at build time and don't automatically update
-   **React Query Cache:** Shared between server and client, enabling cross-boundary cache invalidation

### 5. Configuration & Workflow

-   **Protected Procedures:** All chat operations use `protectedProcedure` with RLS middleware
-   **Cache Strategy:** Invalidate `chat.getAll` on any chat modification (create, update, delete, rename)
-   **Error Handling:** Cache invalidation should only happen on successful operations (`onSuccess`)

### 6. Future Implementation Patterns

For implementing chat rename/delete features, follow these patterns:

**Chat Rename:**
```typescript
const renameChatMutation = api.chat.updateTitle.useMutation({
  onSuccess: () => {
    void utils.chat.getAll.invalidate();
  },
});
```

**Chat Delete:**
```typescript
const deleteChatMutation = api.chat.delete.useMutation({
  onSuccess: () => {
    void utils.chat.getAll.invalidate();
  },
});
```

**Optimistic Updates (Optional):**
```typescript
const mutation = api.chat.someOperation.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await utils.chat.getAll.cancel();
    
    // Snapshot previous value
    const previousChats = utils.chat.getAll.getData();
    
    // Optimistically update
    utils.chat.getAll.setData(undefined, (old) => {
      // Update logic here
      return updatedChats;
    });
    
    return { previousChats };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.chat.getAll.setData(undefined, context?.previousChats);
  },
  onSuccess: () => {
    void utils.chat.getAll.invalidate();
  },
});
```

### 7. Known Issues

-   **Server Component Staleness:** Server components don't automatically reflect client-side changes
-   **Cache Synchronization:** Requires manual cache invalidation for all chat operations
-   **Performance Considerations:** Excessive cache invalidation could impact performance

### 8. Testing Strategy

-   **Chat Creation:** Test from both homepage and within existing chats
-   **Title Updates:** Test first message flow and verify sidebar updates immediately
-   **Rapid Operations:** Test multiple rapid chat operations to ensure no race conditions
-   **Server-Side Rendering:** Verify server components continue to work correctly 