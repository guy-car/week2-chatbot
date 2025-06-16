'use server'

import AppSidebar from "~/app/_components/server/chat-sidebar"; // Direct import
import { NewChatComponent } from './NewChatComponent';

export async function LandingPage() {

    return (
        <div className='flex'>
            {/* <Header /> */}
            <AppSidebar /> {/* Added here temporarily */}
            <NewChatComponent />
        </div>
    )
}