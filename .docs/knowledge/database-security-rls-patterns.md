# State Report: Row-Level Security (RLS)

**Last Updated:** 2024-07-16

### 1. Overview

This document describes the implementation of Row-Level Security (RLS) in the application's PostgreSQL database. The system is designed to enforce data isolation at the database level, ensuring that authenticated users can only access and modify their own data (chats, preferences, etc.). This is a critical security measure that prevents data leaks between different user accounts.

### 2. Key Components & File Paths

-   **RLS Middleware (`src/server/api/trpc.ts`):**
    -   This file contains the `rlsMiddleware` for tRPC. For every protected API request, this middleware initiates a database transaction and sets a session-local variable, `rls.user_id`, to the ID of the authenticated user. This variable is the foundation of all our RLS policies.

-   **Definitive Migration File (`drizzle/0000_initial-schema-and-rls.sql`):**
    -   This single SQL file is the canonical starting point for the entire database. It contains all the `CREATE TABLE` statements for the schema *and* all the `CREATE POLICY` statements to enable and configure RLS. A new, clean database can be fully provisioned just by running this one migration.

-   **Schema Definition (`src/server/db/schema.ts`):**
    -   This is the Drizzle schema file that defines the application's table structures in TypeScript. It is the source of truth from which all database schemas are generated.

### 3. Implementation Details & Quirks

-   **User Context via `rls.user_id`:**
    -   Unlike a standard Supabase project that might use `auth.uid()`, this project uses a custom `next-auth` and tRPC setup. We cannot rely on a built-in function to get the user's ID within a database query.
    -   **Solution:** The `rlsMiddleware` in `trpc.ts` sets the `rls.user_id` at the beginning of every protected request. All RLS policies in the database are written to read from this variable using `current_setting('rls.user_id', true)`.

-   **RLS Performance Optimization:**
    -   A naive RLS policy like `USING (user_id = current_setting(...))` can cause significant performance issues at scale, as the `current_setting()` function is re-evaluated for every single row in a query.
    -   **Solution:** All policies in this project use the optimized syntax `USING (user_id = (SELECT current_setting(...)))`. The `(SELECT ...)` subquery forces PostgreSQL to evaluate the user's ID only *once* per query and cache the result, leading to a massive performance improvement.

-   **The `verification` Table Exception:**
    -   RLS has been intentionally **disabled** on the `public.verification` table.
    -   **Reason:** This table is used to store temporary tokens for processes like email verification, where the user is *not yet logged in*. Since our RLS policies rely on a logged-in user's ID, they cannot be applied to this table's workflow. The table is still secure as it is only accessed by server-side logic.

### 4. Dependencies

-   **Drizzle ORM (`drizzle-orm`, `drizzle-kit`):** Used for schema definition, database migrations, and queries.
-   **Postgres.js (`postgres`):** The underlying PostgreSQL client library used by Drizzle.
-   **better-auth:** The authentication library that provides the user session context.

### 5. Configuration & Workflow

-   **Protected Procedures:** The RLS system is only active on database queries that are executed within a tRPC `protectedProcedure`, as these are the only ones that use the `rlsMiddleware`.
-   **Database Setup:** A new, clean database can be set up from scratch by running `bun run db:migrate`, which executes the `0000_...` migration file. This is the official workflow for provisioning the database. 