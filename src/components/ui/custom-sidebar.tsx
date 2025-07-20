import Link from "next/link"
import Image from "next/image"
import { buttonVariants } from "~/styles/component-styles"
import RecentChatsSection from "~/app/_components/client/RecentChatsSection"
import { useCustomSidebar } from "./custom-sidebar-context"

// Custom Sidebar Components
interface CustomSidebarProps {
  className?: string
  chats: Array<{
    id: string
    title: string | null
    createdAt: Date
  }>
}

interface CustomSidebarButtonProps {
  href: string
  icon: string
  children: React.ReactNode
  className?: string
}

// Custom Sidebar Button Component
function CustomSidebarButton({ href, icon, children, className }: CustomSidebarButtonProps) {
  return (
    <Link 
      href={href}
      className={`${buttonVariants.sidebar} flex items-center gap-3 w-full h-[51px] px-4 mb-2 ${className ?? ''}`}
    >
      <Image 
        src={icon} 
        alt="" 
        width={40} 
        height={40}
        className="flex-shrink-0"
      />
      <span className="text-white font-bold text-[21px]">{children}</span>
    </Link>
  )
}

// Main Custom Sidebar Component
export default function CustomSidebar({ className, chats }: CustomSidebarProps) {
  const { isOpen } = useCustomSidebar()
  
  // Don't render if not open
  if (!isOpen) return null

  const formatChatDate = (createdAt: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(createdAt));
  };

  return (
    <div className={`fixed left-0 w-[293px] flex flex-col border border-[rgba(0,229,255,0.99)] rounded-br-[11px] rounded-tr-[11px] bg-[#0A0A0B] z-50 ${className ?? ''}`} style={{
      top: 'calc(123px + 20px)',
      height: 'calc(100vh - 123px - 40px)'
    }}>
      {/* Navigation Buttons - Each as standalone button */}
      <div className="flex flex-col space-y-2 mb-4 px-4 pt-4">
        <CustomSidebarButton 
          href="/watchlist" 
          icon="/icons/sidebar/star.png"
        >
          Watchlist
        </CustomSidebarButton>
        
        <CustomSidebarButton 
          href="/profile" 
          icon="/icons/sidebar/pop-corn.png"
        >
          Taste Profile
        </CustomSidebarButton>
        
        <CustomSidebarButton 
          href="/history" 
          icon="/icons/sidebar/film-can-1.png"
        >
          Watch History
        </CustomSidebarButton>
      </div>

      {/* Recent Chats Section - Client-side interactive */}
      <div className="flex-1 mt-4 px-4">
        <RecentChatsSection chats={chats} />
      </div>

      {/* Sign Out Button - At the very bottom */}
      <div className="mt-auto px-4 pb-4">
        <CustomSidebarButton 
          href="/auth/signout" 
          icon="/icons/sidebar/sign-out.png"
        >
          Sign out
        </CustomSidebarButton>
      </div>
    </div>
  )
} 