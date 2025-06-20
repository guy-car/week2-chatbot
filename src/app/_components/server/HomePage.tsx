import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { NewChatComponent } from '../client/NewChatComponent';
import { Bookmark, History, User } from 'lucide-react'
import { HomepageCard } from '~/app/_components/client/HomepageCard'

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

    return (
        <>
            <NewChatComponent user={session.user} />;
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 mt-12">
                <HomepageCard
                    title="Watchlist"
                    href="/watchlist"
                    icon={<Bookmark className="w-8 h-8" />}
                    storageKey="watchlist"
                    emptyMessage="No movies saved yet"
                />

                <HomepageCard
                    title="Watch History"
                    href="/history"
                    icon={<History className="w-8 h-8" />}
                    storageKey="watchHistory"
                    emptyMessage="No movies watched yet"
                />

                <HomepageCard
                    title="Taste Profile"
                    href="/profile"
                    icon={<User className="w-8 h-8" />}
                    storageKey={null}
                    emptyMessage="Build your profile"
                />
            </div>

        </>
    )
}