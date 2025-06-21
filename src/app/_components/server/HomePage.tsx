import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { NewChatComponent } from '../client/NewChatComponent';
import { Bookmark, History } from 'lucide-react'
import { HomepageCard } from '~/app/_components/client/HomepageCard'
import { api } from "~/trpc/server";

export async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return (
            <div className="text-center py-8">
                <h1 className="text-2xl mb-4">It really gets you</h1>
            </div>
        );
    }

    // Fetch latest movies server-side
    const latestMovies = await api.movies.getLatestMovies();

    return (
        <>
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
        </>
    )
}