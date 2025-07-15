"use client";
import { AuthCard } from "@daveyplate/better-auth-ui";
import { useParams } from "next/navigation";

export default function AuthPage() {
  const params = useParams();
  const pathname = Array.isArray(params.pathname)
    ? params.pathname[0]
    : params.pathname;
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6">
        <AuthCard
          pathname={pathname}
          classNames={{
            continueWith: "grid grid-cols-[1fr_auto_1fr] items-center gap-2",
            footer: "flex flex-col items-center gap-4 pt-4 [&_button]:w-full [&_button]:dark:bg-card [&_button]:border [&_button]:border-input [&_button]:shadow-xs [&_button]:h-9 [&_button]:px-4 [&_button]:py-2",
            footerLink: "w-full no-underline"
          }}
        />
      </div>
    </div>
  );
} 