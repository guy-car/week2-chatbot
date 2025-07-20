"use client"

import { api } from "~/trpc/react"
import { useSession } from "~/lib/auth-client"
import CustomSidebar from "~/components/ui/custom-sidebar"

export default function CustomSidebarWrapper() {
  const { data: session } = useSession()
  const { data: chats } = api.chat.getAll.useQuery()

  if (!session || !chats) return null

  return <CustomSidebar chats={chats} />
} 