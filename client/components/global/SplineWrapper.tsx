'use client'

import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="flex inset-0 h-full w-full items-center justify-center bg-transparent">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/20 border-t-red-500" />
    </div>
  )
})

interface SplineWrapperProps {
  scene: string
  className?: string
}

export default function SplineWrapper({ scene, className }: SplineWrapperProps) {
  const [isInView, setIsInView] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', checkMobile)
      observer.disconnect()
    }
  }, [])

  if (isMobile) {
    return null
  }

  return (
    <div ref={containerRef} className={className}>
      {isInView && <Spline scene={scene} className={className} />}
    </div>
  )
}
