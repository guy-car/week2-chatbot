'use server'

import { NewChatComponent } from './NewChatComponent';

export async function LandingPage() {

    return (
        <div>
            <NewChatComponent />
        </div>
    )
}