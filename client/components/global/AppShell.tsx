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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setIsMenuOpen((prev) => !prev)
    window.addEventListener('toggle-menu', handleToggle)
    return () => window.removeEventListener('toggle-menu', handleToggle)
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('modal-open')
      window.dispatchEvent(new CustomEvent('modal-visibility-change', { detail: { open: true } }))
    } else {
      document.body.classList.remove('modal-open')
      window.dispatchEvent(new CustomEvent('modal-visibility-change', { detail: { open: false } }))
    }
  }, [isMenuOpen])

  return (
    <div className="relative min-h-screen">
      {/* Animated Global Background Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black" />

      <PageLoader />
      <TargetCursor />
      <CustomCursor />
      <ScrollProgress />
      <BrandLogo />
      <SideNav />
      <MenuOverlay isOpen={isMenuOpen} close={() => setIsMenuOpen(false)} />
      <AgentChatWidget />
      {children}
    </div>
  )
}
