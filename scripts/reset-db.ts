// scripts/reset-db.ts
import { sql } from "drizzle-orm";
import { db } from "~/server/db";

async function resetDatabase() {
    console.log("🗑️  Dropping all tables...");

    // Drop all tables in the correct order (respecting foreign keys)
    await db.execute(sql`DROP TABLE IF EXISTS messages CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS chats CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS movie_interactions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS user_movies CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS user_preferences CASCADE`);

    // Drop the old prefixed tables
    await db.execute(sql`DROP TABLE IF EXISTS "week2-chatbot_messages" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "week2-chatbot_chat" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "week2-chatbot_account" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "week2-chatbot_session" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "week2-chatbot_user" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "week2-chatbot_verification" CASCADE`);

    // Drop better-auth tables too
    await db.execute(sql`DROP TABLE IF EXISTS account CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS session CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "user" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS verification CASCADE`);

    // Drop enums
    await db.execute(sql`DROP TYPE IF EXISTS interaction_type CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS collection_type CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS media_type CASCADE`);

    // Clear Drizzle's migration table
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`);
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

    console.log("✅ All tables dropped!");
}

resetDatabase().catch(console.error);