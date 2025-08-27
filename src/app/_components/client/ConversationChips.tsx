'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import { type Chip } from '~/app/types'
import { buttonVariants } from '~/styles/component-styles'

// Cinema icons for the loading state
const CINEMA_ICONS = [
  '/icons/animation/lamp-alt-2.png',
  '/icons/animation/lamp-alt-1.png', 
  '/icons/animation/star-alt.png',
  '/icons/animation/reel-1.png',
  '/icons/animation/pop-corn.png',
  '/icons/animation/light.png',
  '/icons/animation/gem.png',
  '/icons/animation/clap.png',
  '/icons/animation/camera-2-modern.png',
  '/icons/animation/camera-1.png'
];

// Cache successful/failed icon loads to avoid repeated network checks
const iconLoadCache = new Map<string, boolean>()

function checkIconAvailable(path: string): Promise<boolean> {
    if (iconLoadCache.has(path)) {
        return Promise.resolve(iconLoadCache.get(path)!)
    }
    return new Promise<boolean>((resolve) => {
        const img = new window.Image()
        const done = (ok: boolean) => {
            iconLoadCache.set(path, ok)
            resolve(ok)
        }
        img.onload = () => done(true)
        img.onerror = () => done(false)
        img.src = path
    })
}

// Context for managing promoted icons
interface PromotedIconsContextType {
  promotedIcons: string[]
  promoteIcon: (iconPath: string) => void
}

const PromotedIconsContext = createContext<PromotedIconsContextType>(null!)

export function usePromotedIcons() {
  return useContext(PromotedIconsContext)
}

// Provider component
export function PromotedIconsProvider({ children }: { children: React.ReactNode }) {
  const [promotedIcons, setPromotedIcons] = useState<string[]>([])
  
  const promoteIcon = (iconPath: string) => {
    setPromotedIcons(prev => {
      if (!prev.includes(iconPath)) {
        return [...prev, iconPath]
      }
      return prev
    })
  }
  
  return (
    <PromotedIconsContext.Provider value={{ promotedIcons, promoteIcon }}>
      {children}
    </PromotedIconsContext.Provider>
  )
}

interface ConversationChipsProps {
    chips: Chip[]
    isAiThinking?: boolean
    onChipClick: (chipText: string) => void
    thinkingVariant?: 'static' | 'scroll'
    onMouseEnter?: () => void
}

export function ConversationChips({ chips, isAiThinking = false, onChipClick, thinkingVariant = 'static' }: ConversationChipsProps) {
    // Random icons state - regenerate when AI starts thinking
    const [randomIcons, setRandomIcons] = useState<string[]>([])
    // Click counters for each icon (persists across AI thinking sessions)
    const [iconClickCounts, setIconClickCounts] = useState<Record<string, number>>({})
    // Animation state for promotion
    const [promotingIcon, setPromotingIcon] = useState<string | null>(null)
    // Rotation state for click animations
    const [iconRotations, setIconRotations] = useState<Record<string, number>>({})
    
    // Get promoted icons context
    const { promoteIcon } = usePromotedIcons()
    
    // Generate random icons from those that actually load, when AI starts thinking
    useEffect(() => {
        let isCancelled = false
        if (isAiThinking) {
            Promise.all(CINEMA_ICONS.map(async (p) => ({ path: p, ok: await checkIconAvailable(p) })))
                .then(results => {
                    if (isCancelled) return
                    const available = results.filter(r => r.ok).map(r => r.path)
                    const pool = available.length > 0 ? available : CINEMA_ICONS
                    const shuffled = [...pool].sort(() => Math.random() - 0.5)
                    setRandomIcons(shuffled)
                })
                .catch(() => {
                    if (isCancelled) return
                    const shuffled = [...CINEMA_ICONS].sort(() => Math.random() - 0.5)
                    setRandomIcons(shuffled)
                })
        }
        return () => { isCancelled = true }
    }, [isAiThinking])

    // Handle icon clicks
    const handleIconClick = (iconPath: string) => {
        const newCount = Math.min((iconClickCounts[iconPath] ?? 0) + 1, 12)
        
        setIconClickCounts(prev => ({
            ...prev,
            [iconPath]: newCount
        }))
        
        // Add rotation bounce effect
        const rotationDirection = Math.random() > 0.5 ? 1 : -1 // Random left or right
        const rotationAmount = (10 + Math.random() * 10) * rotationDirection // 10-20 degrees
        
        setIconRotations(prev => ({
            ...prev,
            [iconPath]: rotationAmount
        }))
        
        // Reset rotation after animation
        setTimeout(() => {
            setIconRotations(prev => ({
                ...prev,
                [iconPath]: 0
            }))
        }, 300)
        
        // Trigger promotion animation when reaching max level
        if (newCount === 12) {
            setPromotingIcon(iconPath)
            
            // Start promotion animation sequence
            setTimeout(() => {
                promoteIcon(iconPath)
                setPromotingIcon(null)
            }, 1500) // Animation duration
        }
    }

    // Calculate glow intensity (0 to 1) based on click count
    const getGlowIntensity = (iconPath: string) => {
        const clicks = iconClickCounts[iconPath] ?? 0
        return clicks / 12 // 0 to 1 over 12 clicks
    }

    // Generate dynamic glow styles based on click count
    const getIconStyles = (iconPath: string) => {
        const intensity = getGlowIntensity(iconPath)
        const glowOpacity = intensity * 1.0 // Max opacity of 1.0 (full opacity)
        const glowSize = 8 + (intensity * 32) // Glow size from 8px to 40px
        const scale = 1 + (intensity * 0.3) // Scale from 1 to 1.3 (30% bigger when maxed)
        const rotation = iconRotations[iconPath] ?? 0
        
        // Special animation for promoting icon
        if (promotingIcon === iconPath) {
            return {
                transform: `scale(1.5) translateY(-100px) rotate(${rotation}deg)`,
                filter: `drop-shadow(0 0 ${glowSize * 0.5}px rgba(253, 142, 44, 1)) drop-shadow(0 0 ${glowSize}px rgba(253, 142, 44, 0.8)) drop-shadow(0 0 ${glowSize * 2}px rgba(253, 142, 44, 0.4))`,
                transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 1000,
                position: 'relative' as const
            }
        }
        
        return {
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            filter: `drop-shadow(0 0 ${glowSize * 0.5}px rgba(253, 142, 44, ${glowOpacity})) drop-shadow(0 0 ${glowSize}px rgba(253, 142, 44, ${glowOpacity * 0.6})) drop-shadow(0 0 ${glowSize * 1.5}px rgba(253, 142, 44, ${glowOpacity * 0.3}))`,
            transition: 'all 0.3s ease-out'
        }
    }

    // Show cinema icons when AI is thinking
    if (isAiThinking && randomIcons.length > 0 && thinkingVariant === 'scroll') {
        // Use each available icon exactly once per loop
        const sequence = [...randomIcons]
        const speedSeconds = 9 // ANIMATION SPEED 
        // Keep a natural start; use positive stagger so loop begins from the left
        const visibleWindow = 0.9
        const staggerSeconds = (speedSeconds * visibleWindow) / Math.max(sequence.length, 1)
        const scrollVars: CSSProperties & Record<'--chip-speed', string> = { '--chip-speed': `${speedSeconds}s` }
        return (
            <div className="-mb-5 w-full chip-scroll chip-scroll-mask thinking-fade-in" style={scrollVars}>
                {sequence.map((icon, i) => (
                    <div
                        key={`${icon}-scroll-${i}`}
                        className="chip-scroll-icon select-none"
                        style={{ animationDelay: `${i * staggerSeconds}s`, opacity: 0 }}
                    >
                        <div className="w-20 h-20 flex items-center justify-center">
                            <Image
                                src={icon}
                                alt="Cinema equipment"
                                width={80}
                                height={80}
                                className="object-contain w-full h-full"
                            />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (isAiThinking && randomIcons.length > 0 && thinkingVariant === 'static') {
        return (
            <div className="-mb-5 flex justify-evenly items-center">
                {randomIcons.map((icon, index) => {
                    const isPromoting = promotingIcon === icon
                    
                    return (
                        <div 
                            key={`${icon}-${index}`}
                            className={`cinema-icon-appear transition-transform duration-200 hover:scale-110 cursor-pointer ${isPromoting ? 'pointer-events-none' : ''}`}
                            style={{
                                animationDelay: `${index * 0.2}s`,
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none',
                                WebkitTouchCallout: 'none',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                            onClick={() => !isPromoting && handleIconClick(icon)}
                        >
                            {/* Fixed-size container for consistent icon sizing */}
                            <div className="w-20 h-20 flex items-center justify-center">
                                <Image 
                                    src={icon} 
                                    alt="Cinema equipment" 
                                    width={80}
                                    height={80}
                                    className="object-contain w-full h-full"
                                    style={getIconStyles(icon)}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Show regular chips when not thinking and chips exist
    if (chips.length === 0) return null

    return (
        <div className="mb-3 flex w-full flex-wrap gap-2 justify-evenly">
            {chips.map((chip, index) => (
                <button
                    key={index}
                    className={buttonVariants.chip}
                    onClick={() => onChipClick(chip.text)}
                >
                    {chip.text}
                </button>
            ))}
        </div>
    )
}