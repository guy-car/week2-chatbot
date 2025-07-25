

import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Poppins, Noto_Sans } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from 'react-hot-toast'

import { TRPCReactProvider } from "~/trpc/react";
import { HeaderServer } from '~/app/_components/server/HeaderServer'
import { SidebarProvider } from "~/components/ui/sidebar"
import CustomSidebarWrapper from "~/app/_components/client/CustomSidebarWrapper";
import { CustomSidebarProvider } from "~/components/ui/custom-sidebar-context";
import { auth } from "~/lib/auth";
import { Providers } from "./providers";

const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
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
    <html lang="en" className={`${geist.variable} ${poppins.variable} ${notoSans.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Savate:wght@200;400;700&display=swap" rel="stylesheet" />

      </head>
      <body>
        <Providers>
          <TRPCReactProvider>
            <CustomSidebarProvider>
              {isLoggedIn ? loggedInLayout : loggedOutLayout}
              <Toaster />
            </CustomSidebarProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}