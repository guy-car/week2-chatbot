import { betterAuth, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";
import { sendEmail } from "./email";
import VerificationEmail from "~/emails/VerificationEmail";
import PasswordResetEmail from "~/emails/PasswordResetEmail";

type EmailData = {
  user: User;
  url: string;
  token: string;
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "https://watch-genie.com",
    "https://www.watch-genie.com",
    "https://week2-chatbot.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendEmailVerification: async (data: EmailData) => {
      await sendEmail({
        to: data.user.email,
        subject: "Verify your email address",
        react: VerificationEmail({ url: data.url }),
      });
    },
    sendResetPassword: async (data: EmailData) => {
      await sendEmail({
        to: data.user.email,
        subject: "Reset your password",
        react: PasswordResetEmail({ url: data.url }),
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});