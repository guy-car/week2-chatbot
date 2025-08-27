// app/page.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '~/lib/auth';
import { api } from '~/trpc/server';
import { WelcomeMessage } from '~/app/_components/client/WelcomeMessage';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return (
      <div className="text-center py-8">
        <WelcomeMessage chatId={new Date().toDateString()} />
      </div>
    );
  }

  const { chatId } = await api.chat.create();
  redirect(`/chat/${chatId}`);
}