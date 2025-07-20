import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { HeaderClient } from "../client/HeaderClient";

export async function HeaderServer() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return (
    <header className='w-full bg-[#0a0a0b] border-b border-[#fd8e2c] h-[123px]'>
      <div className='h-full flex items-center px-4'>
        <HeaderClient user={session?.user ?? null} />
      </div>
    </header>
  );
}