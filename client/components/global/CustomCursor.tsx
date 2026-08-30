'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isMobileOrTouch, setIsMobileOrTouch] = useState(true)

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  // High-performance spring for main cursor to prevent snapping
  const mainX = useSpring(cursorX, { damping: 50, stiffness: 1000 })
  const mainY = useSpring(cursorY, { damping: 50, stiffness: 1000 })

  // Trail springs with slightly more distance (lag)
  const trail1X = useSpring(cursorX, { damping: 30, stiffness: 400 })
  const trail1Y = useSpring(cursorY, { damping: 30, stiffness: 400 })
  const trail2X = useSpring(cursorX, { damping: 35, stiffness: 300 })
  const trail2Y = useSpring(cursorY, { damping: 35, stiffness: 300 })
  const trail3X = useSpring(cursorX, { damping: 40, stiffness: 200 })
  const trail3Y = useSpring(cursorY, { damping: 40, stiffness: 200 })
  const trail4X = useSpring(cursorX, { damping: 45, stiffness: 120 })
  const trail4Y = useSpring(cursorY, { damping: 45, stiffness: 120 })

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isCoarse = window.matchMedia('(pointer: coarse)').matches
      const isSmall = window.innerWidth <= 1024
      const isMobile = hasTouch || isCoarse || isSmall
      setIsMobileOrTouch(isMobile)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const handleMouseDown = () => setIsMouseDown(true)
    const handleMouseUp = () => setIsMouseDown(false)

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const hideCursor = target.dataset.cursor === 'hide' || target.closest('[data-cursor="hide"]')
      setIsHidden(!!hideCursor)

      if (
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.dataset.cursor === 'hover'
      ) {
        setIsHovered(true)
      } else {
        setIsHovered(false)
      }
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [cursorX, cursorY])

  if (isMobileOrTouch) {
    return null
  }

  return (
    <>
      <CustomCursorStyles />
      {/* Main Cursor Ball - Adaptive visibility with mix-blend-difference */}
      <motion.div
        className={cn(
          "pointer-events-none fixed left-0 top-0 z-10000 h-5 w-5 rounded-full bg-white mix-blend-difference",
          isHidden && "opacity-0"
        )}
        style={{
          x: mainX,
          y: mainY,
          translateX: '-50%',
          translateY: '-50%',
          scale: isHidden ? 0 : (isMouseDown ? 0.8 : (isHovered ? 1.8 : 1))
        }}
      />
      
      {/* Trail Bubbles - Adaptive visibility */}
      {[
        { x: trail1X, y: trail1Y, scale: 0.7, opacity: 0.6 },
        { x: trail2X, y: trail2Y, scale: 0.5, opacity: 0.4 },
        { x: trail3X, y: trail3Y, scale: 0.3, opacity: 0.3 },
        { x: trail4X, y: trail4Y, scale: 0.2, opacity: 0.2 },
      ].map((bubble, i) => (
        <motion.div
          key={i}
          className={cn(
            "pointer-events-none fixed left-0 top-0 z-9999 h-5 w-5 rounded-full bg-white mix-blend-difference",
            isHidden && "opacity-0"
          )}
          style={{
            x: bubble.x,
            y: bubble.y,
            scale: isHidden ? 0 : bubble.scale * (isHovered ? 1.4 : 1),
            opacity: isHidden ? 0 : bubble.opacity,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
      ))}
    </>
  )
}

function CustomCursorStyles() {
  return (
    <style jsx global>{`
      @media (hover: hover) and (pointer: fine) and (min-width: 1024px) {
        * {
          cursor: none !important;
        }
        [data-cursor="hide"], 
        [data-cursor="hide"] * {
          cursor: pointer !important;
        }
      }
    `}</style>
  )
}
