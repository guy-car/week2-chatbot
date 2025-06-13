// components/app-sidebar.tsx
import { MessageSquare } from "lucide-react"
import { api } from "~/trpc/react"
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

export function AppSidebar() {

console.log('api object:', api);
  console.log('api.chat:', api.chat);
  
  const { data: chats, isLoading } = api.chat.getAll.useQuery()

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