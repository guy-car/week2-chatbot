

import "~/styles/globals.css";

import { type Metadata } from "next";
import { Noto_Sans, Noto_Sans_Display, Inter } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from 'react-hot-toast'
import { colors, borderRadius } from '~/styles/design-tokens'

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
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Watch Genie",
  description: "Magical, personalized Movies & TV Shows recommendations",
  metadataBase: new URL("https://www.watch-genie.com"),
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    type: "website",
    url: "https://www.watch-genie.com",
    siteName: "Watch Genie",
    title: "Watch Genie",
    description: "Magical, personalized Movies & TV Shows recommendations",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Watch Genie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watch Genie",
    description: "Magical, personalized Movies & TV Shows recommendations",
    images: ["/og.png"],
  },
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
                <Toaster 
                  position="top-center" 
                  containerStyle={{ zIndex: 999999 }}
                  toastOptions={{
                    style: {
                      color: colors.text.primary,
                      background: `linear-gradient(135deg, rgba(2,255,251,0.09) 0%, rgba(0,0,0,0.00) 55%, rgba(2,255,251,0.06) 100%), ${colors.background.secondary}`,
                      borderRadius: borderRadius.md,
                      border: `0.5px solid ${colors.border.subtle}`,
                      boxShadow: 'none',
                    },
                  }}
                />
              </PromotedIconsProvider>
            </CustomSidebarProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}