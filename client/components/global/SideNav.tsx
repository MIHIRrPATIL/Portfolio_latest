'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMediaQuery } from 'react-responsive'
import { usePathname } from 'next/navigation'

export default function SideNav() {
  const [isHeroActive, setIsHeroActive] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isDesktop = useMediaQuery({ minWidth: 768 })
  const { scrollY } = useScroll()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Trigger global menu event
  const toggleMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-menu'))
  }

  // Detect if we are past the hero section
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 500) {
      setIsHeroActive(false)
    } else {
      setIsHeroActive(true)
    }
  })

  const sections = [
    { name: 'Home', id: 'hero' },
    { name: 'About', id: 'about' },
    { name: 'Wins', id: 'achievements' },
    { name: 'Works', id: 'works' },
    { name: 'Connect', id: 'connect' },
  ]

  const totalLines = 60
  const linesPerSection = Math.floor(totalLines / sections.length)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {(hasMounted && isHomePage && isHeroActive && isDesktop) ? (
          // STAGE 1: Section Navigator (Desktop Hero Only)
          <motion.nav
            key="side-stagger"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-0 top-0 z-100 flex h-screen flex-col items-end justify-between py-12 pl-8 pr-0 mix-blend-difference"
          >
            <div className="flex h-full flex-col items-end justify-between">
              {sections.map((section) => (
                <div key={section.name} data-cursor="hide" className="flex flex-col items-end group relative w-96 h-[22vh] justify-center pr-12 bg-transparent">
                  <div className="flex flex-col items-end justify-between h-full py-6 relative pointer-events-none">
                    {[...Array(linesPerSection)].map((_, i) => {
                      const isBigger = i === Math.floor(linesPerSection / 2)
                      return (
                        <motion.button
                          key={i}
                          onClick={() => scrollToSection(section.id)}
                          data-cursor="no-target"
                          whileHover={{ width: 140, backgroundColor: '#ffffff' }}
                          className={cn(
                            "h-[5px] bg-white/20 transition-all duration-300 pointer-events-auto",
                            isBigger ? "w-14 bg-white/60" : "w-6"
                          )}
                        />
                      )
                    })}
                  </div>
                  
                  {/* Section Name reveal on group hover */}
                  <motion.span
                    className="absolute right-40 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-lg font-bold uppercase tracking-[0.3em] opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:-translate-x-8 text-white"
                  >
                    {section.name}
                  </motion.span>
                </div>
              ))}
            </div>
          </motion.nav>
        ) : (
          // STAGE 2: Minimalist Corner Menu (Mobile OR Scrolled)
          <motion.button
            key="menu-icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={toggleMenu}
            className="fixed right-4 top-4 z-100 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-foreground text-background shadow-xl sm:right-6 sm:top-6 md:right-10 md:top-10 transition-transform hover:scale-110 active:scale-95 cursor-target"
          >
            <div className="flex flex-col gap-1 sm:gap-1.5 items-end">
              <span className="block h-0.5 w-4 sm:w-6 bg-background" />
              <span className="block h-0.5 w-2.5 sm:w-4 bg-background" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
