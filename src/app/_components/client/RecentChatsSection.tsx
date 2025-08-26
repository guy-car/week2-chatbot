"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { buttonVariants } from "~/styles/component-styles"

interface RecentChatsSectionProps {
  chats: Array<{
    id: string
    title: string | null
    createdAt: Date
  }>
}

export default function RecentChatsSection({ chats }: RecentChatsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatChatDate = (createdAt: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(createdAt));
  };

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
                <Link 
                  key={chat.id} 
                  href={`/chat/${chat.id}`}
                  className="block mb-[13px] ms-[27px] hover:text-[#00E5FF] transition-colors truncate"
                  title={chat.title ?? formatChatDate(chat.createdAt)}
                >
                  • {chat.title ?? formatChatDate(chat.createdAt)}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  )
} 