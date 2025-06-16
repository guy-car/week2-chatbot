'use server'
// components/app-sidebar.tsx


import { MessageSquare } from "lucide-react"
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
  console.log(session)
  if (!session) return null

  const chats = await api.chat.getAll();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats?.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild>
                    <a href={`/chat/${chat.id}`}>
                      <MessageSquare />
                      <span>{chat.id}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}