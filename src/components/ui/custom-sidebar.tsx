import Link from "next/link"
import Image from "next/image"
import { useRef, useEffect } from "react"
import { buttonVariants } from "~/styles/component-styles"
import RecentChatsSection from "~/app/_components/client/RecentChatsSection"
import { useCustomSidebar } from "./custom-sidebar-context"
import { signOut } from "~/lib/auth-client"

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

interface SignOutButtonProps {
  icon: string
  children: React.ReactNode
  className?: string
}

// Custom Sidebar Button Component
function CustomSidebarButton({ href, icon, children, className }: CustomSidebarButtonProps) {
  return (
    <Link 
      href={href}
      className={`${buttonVariants.sidebar} flex items-center gap-3 w-full h-[51px] pl-4 pr-8 mb-6 ${className ?? ''}`}
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

// Sign Out Button Component (with click handler)
function SignOutButton({ icon, children, className }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <button 
      onClick={handleSignOut}
      className={`${buttonVariants.sidebar} flex items-center gap-3 w-full h-[51px] pl-4 pr-8 mb-6 ${className ?? ''}`}
    >
      <Image 
        src={icon} 
        alt="" 
        width={40} 
        height={40}
        className="flex-shrink-0"
      />
      <span className="text-white font-bold text-[21px]">{children}</span>
    </button>
  )
}

// Main Custom Sidebar Component
export default function CustomSidebar({ className, chats }: CustomSidebarProps) {
  const { isOpen, closeSidebar } = useCustomSidebar()
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        closeSidebar()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, closeSidebar])

  return (
    <div 
      ref={sidebarRef}
      className={`fixed left-0 w-[293px] flex flex-col border border-[rgba(0,229,255,0.99)] rounded-br-[11px] rounded-tr-[11px] bg-[#0A0A0B] z-50 transform transition-transform duration-300 ease-in-out ${className ?? ''}`} 
      style={{
        top: 'calc(123px + 32px)',
        height: 'calc(100vh - 123px - 64px)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
      }}
    >
      {/* Navigation Buttons - Each as standalone button */}
      <div className="flex flex-col space-y-[21px] mb-0 pr-8 pt-8">
        <CustomSidebarButton 
          href="/watchlist" 
          icon="/icons/sidebar/star.png"
        >
          Watchlist
        </CustomSidebarButton>

        <CustomSidebarButton 
          href="/history" 
          icon="/icons/sidebar/film-can-1.png"
        >
          Watch History
        </CustomSidebarButton>
        
        <CustomSidebarButton 
          href="/profile" 
          icon="/icons/sidebar/pop-corn.png"
        >
          Taste Profile
        </CustomSidebarButton>
        

      </div>

      {/* Recent Chats Section - Client-side interactive */}
      <div className="flex-1 mt-0 pr-8">
        <RecentChatsSection chats={chats} />
      </div>

      {/* Sign Out Button - At the very bottom */}
      <div className="mt-auto pr-8 pb-8">
        <SignOutButton 
          icon="/icons/sidebar/sign-out.png"
        >
          Sign out
        </SignOutButton>
      </div>
    </div>
  )
} 