# Implementation Log: Row-Level Security

**Date:** 2024-07-16

**Goal:** To implement database-level Row-Level Security (RLS) to ensure users can only access their own data, hardening the application against potential data leaks.

**Initial Plan:** The initial plan was to follow the provided action plan: generate a new Drizzle migration file, add the necessary SQL `CREATE POLICY` statements to it, and apply the migration using `db:push` or `db:migrate`.

---

### Chronological Log

**Step 1: Initial Migration Attempt**
-   **Action:** Ran `bun drizzle-kit generate` to create a new migration file.
-   **Observation:** The command failed. Instead of creating an empty file, it became stuck on an interactive prompt, asking if the `account` table should be created or renamed from a table with a `week2-chatbot_` prefix.
-   **Thought Process:** This indicates a mismatch between the schema defined in the code (`schema.ts`) and the state Drizzle believes the database is in. The initial assumption was that the database contained old, prefixed tables that were confusing the tool.

**Step 2: The Prefix Detour**
-   **Action:** Attempted various strategies to resolve the mismatch, including manually creating migration files and, incorrectly, adding the `week2-chatbot_` prefix to the `pgTableCreator` in `schema.ts`.
-   **Observation:** Adding the prefix to the schema caused `db:push` and `db:migrate` to create a new, *duplicate* set of tables with the prefix, leaving the original tables untouched. This made the problem worse.
-   **Thought Process:** The core issue was clearly misunderstood. The prefix was a red herring, and altering the schema was the wrong approach. The user correctly pointed out that the goal was to *remove* prefixes, not add them.

**Step 3: Identifying the Root Cause**
-   **Action:** Paused to reflect on why Drizzle was still seeing prefixed tables even after the database was cleared of them.
-   **Observation:** The user suggested that old migration files might be the problem. A deeper investigation confirmed this and also identified the `drizzle/meta` directory as a source of cached, historical schema state.
-   **Thought Process:** The root cause was not the live database state but the *migration history* itself. Drizzle was comparing the current schema against old `.sql` files and the snapshots in `drizzle/meta`, which contained the conflicting prefixed table definitions.

**Step 4: The "Total Reset" Plan**
-   **Action:** Formulated a new plan based on the user's insight to achieve a truly clean slate.
    1.  Deleted all existing `.sql` migration files from the `drizzle/` directory.
    2.  Deleted the `drizzle/meta` directory to clear Drizzle's cache.
    3.  Ran the `scripts/reset-db.ts` script to wipe the live database.
    4.  Ran `bun run db:push` to bootstrap the database schema directly from `schema.ts`.
    5.  Ran `bun drizzle-kit generate` to create a single, clean blueprint migration file (`0000_...`).
-   **Observation:** This sequence of commands worked perfectly and without any interactive prompts.

**Step 5: Final Implementation & Performance Tuning**
-   **Action:** Edited the single `0000_...` migration file to add all the necessary RLS `CREATE POLICY` statements. The user then ran `db:migrate` to apply them.
-   **Observation:** The policies were applied, but Supabase reported performance warnings, noting that `current_setting()` was being re-evaluated for every row.
-   **Thought Process:** The initial RLS policies were functionally correct but not optimized. The fix was to wrap the `current_setting()` call in a `(SELECT ...)` subquery.
-   **Final Action:** Created a final migration file (`0002_...`, which was later consolidated back into the `0000_...` file during our final reset) to `DROP` and `CREATE` the policies again with the performant syntax. The user ran the final `db:migrate` command, which successfully resolved all warnings.

---

### Problem Summary

The primary obstacle was a persistent conflict between the desired schema state (unprefixed tables) and the migration history recorded by Drizzle. Old `.sql` files and cached snapshots in `drizzle/meta` contained definitions for deprecated, prefixed tables, causing `drizzle-kit generate` to fail repeatedly.

### Solution Summary

The definitive solution was a "total reset" strategy. This involved completely wiping the migration history (deleting `.sql` files and the `drizzle/meta` directory) and the live database. The database was then bootstrapped using `db:push` to create a clean schema. Finally, a single, consolidated migration file was generated to serve as the project's official starting point, and the final, performant RLS policies were added to it.

### Key Learnings & Takeaways

-   **Drizzle's Source of Truth:** `drizzle-kit generate` compares the schema not just against the live database, but also against its own historical snapshots stored in `drizzle/meta`. For a true reset, this folder must be cleared.
-   **RLS Performance:** For optimal performance, any function call (like `current_setting()`) within an RLS policy that is constant for the duration of a query should be wrapped in a `(SELECT ...)` subquery. This ensures it is evaluated only once.
-   **Workflow Distinction:** `db:push` is a prototyping tool for quick, schema-only syncs. `db:migrate` is the production-safe tool for applying version-controlled `.sql` migration files.
-   **RLS Context:** In a non-Supabase stack, RLS requires a mechanism to pass the user context to the database. We achieved this by creating a tRPC middleware to set the `rls.user_id` for each request. 