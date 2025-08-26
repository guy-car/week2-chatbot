"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { buttonVariants } from "~/styles/component-styles"
import { api } from "~/trpc/react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from 'react-hot-toast'

interface RecentChatsSectionProps {
  chats: Array<{
    id: string
    title: string | null
    createdAt: Date
  }>
}

export default function RecentChatsSection({ chats }: RecentChatsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  
  const utils = api.useUtils()
  
  const deleteChatMutation = api.chat["delete"].useMutation({
    onSuccess: async (_data, variables) => {
      // Invalidate and refetch the chat list to update the UI immediately
      await utils.chat.getAll.invalidate()

      // If the deleted chat is currently open, navigate away
      if (pathname === `/chat/${variables.chatId}`) {
        router.push('/');
      }

      toast.success('Chat deleted')
    },
    onError: (error) => {
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
    }
  })

  const formatChatDate = (createdAt: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(createdAt));
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await deleteChatMutation.mutateAsync({ chatId })
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      {/* Recent Chats Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${buttonVariants.sidebar} flex items-center gap-3 w-full h-[51px] pl-4 pr-8 mb-6`}
      >
        <Image 
          src="/icons/sidebar/three-dots.png" 
          alt="" 
          width={47} 
          height={25}
          className="flex-shrink-0"
        />
        <span className="text-white font-bold text-[21px]">Recent chats</span>
      </button>

      {/* Recent Chats List - Expandable */}
      {isExpanded && (
        <div className="bg-[rgba(2,255,251,0.25)] border border-[rgba(0,229,255,0.99)] rounded-br-[11px] rounded-tr-[11px] pl-0 pr-4 pt-4 pb-4 mb-6 max-h-[22vh] overflow-y-auto">
          <div className="text-white text-[18px] font-normal space-y-3">
            {chats?.slice(0, 10).map((chat) => (
              <div
                key={chat.id}
                className="relative group flex items-center justify-between mb-[13px] ms-[27px] hover:text-[#00E5FF] transition-colors"
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                <Link 
                  href={`/chat/${chat.id}`}
                  className="flex-1 truncate"
                  title={chat.title ?? formatChatDate(chat.createdAt)}
                >
                  • {chat.title ?? formatChatDate(chat.createdAt)}
                </Link>
                
                {/* Trash icon that appears on hover */}
                {hoveredChatId === chat.id && (
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="ml-2 p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors cursor-pointer"
                    title="Delete chat"
                  >
                    <Image
                      src="/icons/new_cyan/trash.png"
                      alt="Delete chat"
                      width={16}
                      height={16}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 