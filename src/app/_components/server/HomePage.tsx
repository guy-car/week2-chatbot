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
                <h1 className="text-2xl mb-4">Welcome to the movie recommendation chatbot</h1>
                <p>Please sign in using the button in the top right to start chatting.</p>
            </div>
        );
    }

    return <NewChatComponent user={session.user} />;
}