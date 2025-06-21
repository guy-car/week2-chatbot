/* eslint-disable @next/next/no-img-element */

import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { NewChatComponent } from '../client/NewChatComponent';
import { Bookmark, History } from 'lucide-react'
import { HomepageCard } from '~/app/_components/client/HomepageCard'
import { api } from "~/trpc/server";
import { WelcomeMessage } from "../client/WelcomeMessage";

export async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return (
            <div className="text-center py-8">
                <div className="relative">
                    <img
                        src="/hero-2.png"
                        alt="Watch Genie"
                        className="w-96 h-auto mx-auto mask-vignette"
                    />
                    <WelcomeMessage chatId={new Date().toDateString()} />
                    <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
                </div>
            </div>
        );
    }

    // Fetch latest movies server-side
    const latestMovies = await api.movies.getLatestMovies();

    return (
        <div className="relative min-h-screen">
            {/* Background image - subtle and non-obstructive */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: 'url("/hero-2.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.2, // Very subtle - adjust this value between 0.05-0.15
                    filter: 'blur(1px)' // Optional: adds a slight blur for more subtlety
                }}
            />

            {/* Content wrapper with relative positioning to stay above background */}
            <div className="relative z-10">
                <NewChatComponent user={session.user} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-6 mt-12">
                    <HomepageCard
                        title="Watchlist"
                        href="/watchlist"
                        icon={<Bookmark className="w-8 h-8" />}
                        latestMovie={latestMovies.watchlist.latest}
                        count={latestMovies.watchlist.count}
                        emptyMessage="No movies saved yet"
                    />

                    <HomepageCard
                        title="Watch History"
                        href="/history"
                        icon={<History className="w-8 h-8" />}
                        latestMovie={latestMovies.history.latest}
                        count={latestMovies.history.count}
                        emptyMessage="No movies watched yet"
                    />
                </div>
            </div>
        </div>
    )
}