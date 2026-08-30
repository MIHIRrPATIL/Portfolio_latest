'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function BrandLogo({ className }: { className?: string }) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault()
      const hero = document.getElementById('hero')
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' })
        return
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "brand-logo-btn fixed top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-50 select-none",
        className
      )}
    >
      <Link
        href="/#hero"
        onClick={handleLogoClick}
        className="group relative flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/25 backdrop-blur-xl transition-all duration-400 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(252,165,165,0.15)]"
        aria-label="Mihir Patil Home"
      >
        {/* Minimalist Geometric Monogram Emblem */}
        <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/[0.03] border border-white/10 group-hover:border-red-300/40 transition-colors duration-300 flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:text-red-200 transition-transform duration-500 group-hover:rotate-45"
          >
            {/* Outer Diamond Frame */}
            <rect
              x="12"
              y="2.5"
              width="13.4"
              height="13.4"
              rx="2.5"
              transform="rotate(45 12 2.5)"
              stroke="currentColor"
              strokeWidth="1.2"
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            />
            {/* Center Quantum Core */}
            <circle
              cx="12"
              cy="12"
              r="1.4"
              fill="#fca5a5"
              className="transition-transform duration-300 group-hover:scale-125"
            />
          </svg>
        </div>

        {/* Minimalist Typography */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white/90 group-hover:text-white transition-colors">
            Mihir
          </span>
          <span className="w-1 h-1 rounded-full bg-red-300/80 group-hover:bg-red-300 transition-colors animate-pulse" />
          <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 group-hover:text-white/70 transition-colors">
            2026
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
