import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { NewChatComponent } from '../client/NewChatComponent';

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

    return <NewChatComponent user={session.user} />;
}