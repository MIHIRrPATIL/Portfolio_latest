'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CustomCursor from "./CustomCursor"
import TargetCursor from "../TargetCursor"
import ScrollProgress from "./ScrollProgress"
import PageLoader from "./PageLoader"
import SideNav from "./SideNav"
import MenuOverlay from "./MenuOverlay"
import BrandLogo from "./BrandLogo"
import AgentChatWidget from "../agent/AgentChatWidget"

import { usePathname } from 'next/navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  useEffect(() => {
    const handleToggle = () => setIsMenuOpen((prev) => !prev)
    window.addEventListener('toggle-menu', handleToggle)
    return () => window.removeEventListener('toggle-menu', handleToggle)
  }, [])

  useEffect(() => {
    if (isAdminPage) {
      document.body.classList.remove('modal-open')
      document.body.style.overflow = ''
      setIsMenuOpen(false)
      return
    }

    if (isMenuOpen) {
      document.body.classList.add('modal-open')
      window.dispatchEvent(new CustomEvent('modal-visibility-change', { detail: { open: true } }))
    } else {
      document.body.classList.remove('modal-open')
      window.dispatchEvent(new CustomEvent('modal-visibility-change', { detail: { open: false } }))
    }
  }, [isMenuOpen, isAdminPage])

  return (
    <div className="relative min-h-screen">
      {/* Animated Global Background Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black" />

      {!isAdminPage && <PageLoader />}
      <TargetCursor />
      <CustomCursor />
      {!isAdminPage && <ScrollProgress />}
      {!isAdminPage && <BrandLogo />}
      {!isAdminPage && <SideNav />}
      {!isAdminPage && <MenuOverlay isOpen={isMenuOpen} close={() => setIsMenuOpen(false)} />}
      {!isAdminPage && <AgentChatWidget />}
      {children}
    </div>
  )
}
