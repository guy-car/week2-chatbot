"use client"

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface CustomSidebarContextType {
  isOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

const CustomSidebarContext = createContext<CustomSidebarContextType | undefined>(undefined)

interface CustomSidebarProviderProps {
  children: ReactNode
}

export function CustomSidebarProvider({ children }: CustomSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)
  const openSidebar = () => setIsOpen(true)
  const closeSidebar = () => setIsOpen(false)

  return (
    <CustomSidebarContext.Provider value={{ isOpen, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </CustomSidebarContext.Provider>
  )
}

export function useCustomSidebar() {
  const context = useContext(CustomSidebarContext)
  if (context === undefined) {
    throw new Error('useCustomSidebar must be used within a CustomSidebarProvider')
  }
  return context
} 