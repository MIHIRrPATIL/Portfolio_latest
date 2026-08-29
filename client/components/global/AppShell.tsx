'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CustomCursor from "./CustomCursor"
import TargetCursor from "../TargetCursor"
import ScrollProgress from "./ScrollProgress"
import PageLoader from "./PageLoader"
import SideNav from "./SideNav"
import MenuOverlay from "./MenuOverlay"
import AgentChatWidget from "../agent/AgentChatWidget"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setIsMenuOpen((prev) => !prev)
    window.addEventListener('toggle-menu', handleToggle)
    return () => window.removeEventListener('toggle-menu', handleToggle)
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Animated Global Background Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black" />

      <PageLoader />
      <TargetCursor />
      <CustomCursor />
      <ScrollProgress />
      <SideNav />
      <MenuOverlay isOpen={isMenuOpen} close={() => setIsMenuOpen(false)} />
      <AgentChatWidget />
      {children}
    </div>
  )
}
