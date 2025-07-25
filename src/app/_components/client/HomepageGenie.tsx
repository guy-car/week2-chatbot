'use client'

import Image from 'next/image'
import { useCustomSidebar } from '~/components/ui/custom-sidebar-context'

export function HomepageGenie() {
  const { isOpen } = useCustomSidebar()

  return (
    <div 
      className={`fixed left-8 top-1/2 transform -translate-y-1/2 z-10 transition-opacity duration-300 ease-in-out ${
        isOpen ? 'opacity-0' : 'opacity-0'
      }`}
      style={{
        top: 'calc(50% + 30px)' // Offset slightly below center to account for header
      }}
    >
      <Image
        src="/genie/genie-1.png"
        alt="Watch Genie"
        width={300}
        height={300}
        className="w-60 h-60 md:w-80 md:h-80 lg:w-100 lg:h-100 object-contain"
        priority
      />
    </div>
  )
} 