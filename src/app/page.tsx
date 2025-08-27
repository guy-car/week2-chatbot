// app/page.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '~/lib/auth';
import { api } from '~/trpc/server';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { chatId } = await api.chat.create();
  redirect(`/chat/${chatId}`);
}