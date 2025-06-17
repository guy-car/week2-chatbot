'use server'

import { NewChatComponent } from '../client/NewChatComponent';

export async function HomePage() {

    return (
        <div>
            <NewChatComponent />
        </div>
    )
}