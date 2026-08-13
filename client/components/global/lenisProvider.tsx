'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,        // scroll animation length in seconds
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease
      orientation: 'vertical',
      smoothWheel: true,
    })

    lenisRef.current = lenis

    // Lenis needs its own RAF loop
    let animationFrameId: number

    function raf(time: number) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    // Handle dynamic height changes (e.g. hydration, animations)
    const resizeObserver = new ResizeObserver(() => {
      // Most Lenis versions support resize() or recalculate()
      if (typeof lenis.resize === 'function') {
        lenis.resize()
      }
    })
    
    // Check if document exists before observing
    if (typeof document !== 'undefined') {
      resizeObserver.observe(document.body)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (typeof document !== 'undefined') {
        resizeObserver.disconnect()
      }
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}