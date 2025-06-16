import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { HeaderClient } from "../client/HeaderClient";

export async function HeaderServer() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  console.log("HeaderServer session:", session); // Check server logs
  console.log("HeaderServer user:", session?.user); // Check server logs
  console.log("HEY I AMMM HEREEEEEE")



  return (
    <header className='w-full border-b p-4'>
      <div className='flex justify-between items-center max-w-7xl mx-auto'>
        <h1 className='text-xl font-bold'>Movie Chatbot</h1>
        <div className='flex items-center gap-4'>
          <HeaderClient user={session?.user ?? null} />
        </div>
      </div>
    </header>
  );
}