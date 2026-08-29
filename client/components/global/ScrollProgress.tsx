'use client'

import { useScroll, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const [percent, setPercent] = useState(0)

  // Smooth the progress value for the counter
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 30,
    stiffness: 200,
  })

  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (latest) => {
      // Clamp between 0 and 100
      const val = Math.min(100, Math.max(0, latest * 100))
      setPercent(val)
    })
    return () => unsubscribe()
  }, [smoothProgress])

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col items-start gap-1 font-mono text-sm mix-blend-difference md:bottom-12 md:right-12 pointer-events-none select-none">
      <span className="flex items-baseline gap-1">
        <span className="text-xl font-bold md:text-2xl font-mono tabular-nums">{percent.toFixed(2)}</span>
        <span className="opacity-50 font-mono text-xs">%</span>
      </span>
    </div>
  )
}
