'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from 'react-responsive'
import { usePathname } from 'next/navigation'

export default function SideNav() {
  const [hasMounted, setHasMounted] = useState(false)
  const [isModalActive, setIsModalActive] = useState(false)
  
  const pathname = usePathname()
  const isGraphPage = pathname?.startsWith('/graph')
  const isAdminPage = pathname?.startsWith('/admin')
  const isDesktop = useMediaQuery({ minWidth: 768 })

  useEffect(() => {
    setHasMounted(true)

    const checkModalState = () => {
      const isLocked = document.body.style.overflow === 'hidden' || 
                       document.body.classList.contains('modal-open') ||
                       document.querySelector('[role="dialog"]') !== null ||
                       document.querySelector('[data-modal="true"]') !== null;
      setIsModalActive(Boolean(isLocked))
    }

    // Check immediately and on DOM changes
    checkModalState()
    const observer = new MutationObserver(checkModalState)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-modal-open'] })

    const handleCustomModal = (e: any) => {
      setIsModalActive(Boolean(e.detail?.open))
    }
    window.addEventListener('modal-visibility-change', handleCustomModal)

    return () => {
      observer.disconnect()
      window.removeEventListener('modal-visibility-change', handleCustomModal)
    }
  }, [])

  // Trigger global menu event
  const toggleMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-menu'))
  }

  // Do not render on admin pages or on /graph for mobile screens
  if (isAdminPage) {
    return null
  }

  if (hasMounted && isGraphPage && !isDesktop) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      {hasMounted && !isModalActive && (
        <motion.button
          id="corner-menu-btn"
          key="menu-icon"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={toggleMenu}
          className="corner-menu-btn fixed right-4 top-4 z-100 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-foreground text-background shadow-xl sm:right-6 sm:top-6 md:right-10 md:top-10 transition-transform hover:scale-110 active:scale-95 cursor-target"
          aria-label="Open navigation menu"
        >
          <div className="flex flex-col gap-1 sm:gap-1.5 items-end">
            <span className="block h-0.5 w-4 sm:w-6 bg-background" />
            <span className="block h-0.5 w-2.5 sm:w-4 bg-background" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
