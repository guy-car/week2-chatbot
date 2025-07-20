'use client'

import { useCustomSidebar } from './custom-sidebar-context'
import { Button } from './button'
import { cn } from '~/styles/component-styles'
import Image from 'next/image'

interface CustomSidebarTriggerProps {
  className?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function CustomSidebarTrigger({ className, onClick, ...props }: CustomSidebarTriggerProps) {
  const { toggleSidebar } = useCustomSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="default"
      className={cn("size-20 p-2", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <Image
        src="/icons/sidebar/side-bar.png"
        alt="Toggle Sidebar"
        width={80}
        height={80}
        className="h-14 w-22 mt-1"
      />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
} 