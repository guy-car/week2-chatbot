

import "~/styles/globals.css";

import { type Metadata } from "next";
import { Noto_Sans, Noto_Sans_Display, Inter } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from 'react-hot-toast'

import { TRPCReactProvider } from "~/trpc/react";
import { HeaderServer } from '~/app/_components/server/HeaderServer'
import { SidebarProvider } from "~/components/ui/sidebar"
import CustomSidebarWrapper from "~/app/_components/client/CustomSidebarWrapper";
import { CustomSidebarProvider } from "~/components/ui/custom-sidebar-context";
import { auth } from "~/lib/auth";
import { Providers } from "./providers";
import { PromotedIconsProvider } from "~/app/_components/client/ConversationChips";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'],
  variable: "--font-noto-sans",
});

const notoSansDisplay = Noto_Sans_Display({
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'],
  variable: "--font-noto-sans-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ['400'],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Watch Genie",
  description: "Your magical movie recommendation assistant",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const isLoggedIn = !!session?.user;

  const loggedInLayout = (
    <SidebarProvider>
      <CustomSidebarWrapper />
      <main className="flex-1">
        <HeaderServer />
        <div className="p-4">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );

  const loggedOutLayout = (
    <div>
      <HeaderServer />
      <main className="p-4">
        {children}
      </main>
    </div>
  );

  return (
    <html lang="en" className={`${notoSans.variable} ${notoSansDisplay.variable} ${inter.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-page-cinematic min-h-screen">
        <Providers>
          <TRPCReactProvider>
            <CustomSidebarProvider>
              <PromotedIconsProvider>
                {isLoggedIn ? loggedInLayout : loggedOutLayout}
                <Toaster />
              </PromotedIconsProvider>
            </CustomSidebarProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}