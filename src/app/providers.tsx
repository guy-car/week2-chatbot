"use client";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import type { ReactNode } from "react";
import { authClient } from "~/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthUIProvider authClient={authClient} social={{ providers: ["github", "google"] }}>{children}</AuthUIProvider>;
} 