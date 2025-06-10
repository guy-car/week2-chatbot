// app/page.tsx
import { createChat } from 'tools/chat-store';
import { redirect } from 'next/navigation';

export default async function Page() {
  const id = await createChat();
  redirect(`/chat/${id}`);
}