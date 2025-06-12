import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from '~/server/db';
import { schema } from '~/server/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});