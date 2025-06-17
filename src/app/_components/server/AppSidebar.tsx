import { MessageSquare, Bookmark, History, Home } from "lucide-react"
import Link from "next/link"
import { api } from "~/trpc/server"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export default async function AppSidebar() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return null

  const chats = await api.chat.getAll();

  const formatChatDate = (createdAt: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(createdAt));
  };

  return (
    <Sidebar className='pt-10'>
      {/* Sidebar Content Area */}
      <SidebarContent>
        {/* Group for sidebar labels and items */}
        <SidebarGroup>
          {/* Sidebar Group Label */}
          <SidebarGroupLabel className="text-xl color">The Genie`s Side Bar</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Menu for navigation items */}
            <SidebarMenu>
              {/* Menu Item: Home */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home />
                    <span className="text-xl">Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Menu Item: Watchlist */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/watchlist">
                    <Bookmark />
                    <span className="text-xl">Watchlist</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Menu Item: Watch History */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/history">
                    <History />
                    <span className="text-xl">Watch History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group for recent chats */}
        <SidebarGroup>
          {/* Sidebar Group Label */}
          <SidebarGroupLabel className="text-xl">Recent chats</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Menu for recent chats */}
            <SidebarMenu>
              {/* Loop through chats */}
              {chats?.slice(0, 10).map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/chat/${chat.id}`}>
                      <MessageSquare />
                      <span className="text-xl">{chat.title ?? formatChatDate(chat.createdAt)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}