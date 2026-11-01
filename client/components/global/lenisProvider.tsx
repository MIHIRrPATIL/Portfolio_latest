'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // 1. Completely bypass Lenis on all admin routes (dashboard, blog studio editor, etc.)
    if (pathname?.startsWith('/admin')) {
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped')
        document.body.style.overflow = ''
      }
      return
    }

    // 2. Initialize Lenis for public showcase routes with nested scroll protection
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      prevent: (node) => {
        // Do not intercept or prevent default scrolling for nested scroll containers
        return (
          node.hasAttribute('data-lenis-prevent') ||
          Boolean(node.closest('[data-lenis-prevent]')) ||
          Boolean(node.closest('[data-lenis-prevent="true"]')) ||
          Boolean(node.closest('.custom-scrollbar')) ||
          Boolean(node.closest('.lenis-prevent')) ||
          Boolean(node.closest('[role="dialog"]')) ||
          node.tagName === 'TEXTAREA' ||
          node.tagName === 'PRE' ||
          node.tagName === 'CODE' ||
          node.tagName === 'INPUT' ||
          node.tagName === 'SELECT'
        )
      },
    })

    lenisRef.current = lenis

    let animationFrameId: number

    function raf(time: number) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    // Handle dynamic height changes (e.g. hydration, animations)
    const resizeObserver = new ResizeObserver(() => {
      if (typeof lenis.resize === 'function') {
        lenis.resize()
      }
    })
    
    if (typeof document !== 'undefined') {
      resizeObserver.observe(document.body)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (typeof document !== 'undefined') {
        resizeObserver.disconnect()
        document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped')
        document.body.style.overflow = ''
      }
      lenis.destroy()
      lenisRef.current = null
    }
  }, [pathname])

  return <>{children}</>
}