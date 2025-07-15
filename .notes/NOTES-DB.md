Here’s a concise but clear summary you can share with Cursor or your team:

---

**Summary of Current RLS Security Issue**

We’ve identified that **Row Level Security (RLS) is currently disabled** on multiple tables in the `public` schema of our Postgres (Supabase) database. The affected tables include:

* `public.user_movies`
* `public.session`
* `public.user_preferences`
* `public.movie_interactions`
* `public.messages`
* `public.account`
* `public.chats`
* `public.user`
* `public.verification`

**Context:**

* This project uses **TRPC for API calls**, and I recall setting certain procedures as **private protocols** in TRPC to limit client access at the API level. However, **TRPC-level access control does not replace or enforce database-level RLS policies**.
* If the database tables have **RLS disabled**, even with TRPC guards, there’s still a risk that unintended access could happen—especially if direct Supabase client calls or other database operations bypass the API layer.

**Next Steps:**

* Assess why RLS is currently disabled on these tables.
* Decide whether to enable RLS and write the appropriate `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies per table.
* Review whether TRPC’s private procedures are properly mapped to the intended security boundaries—but treat that as **separate from RLS**.

**Where to Look:**

* Supabase Dashboard → Table Editor → `public` schema → verify each table's **RLS status and policies**.
* TRPC router definitions → confirm which procedures are marked as `private` or protected.
* Review if any client-side Supabase queries are used directly, bypassing the TRPC layer.

---

Let me know if you want me to help you draft the actual policies or commands.
