'use client'

import { useScroll, useSpring, motion, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { padTwo } from '@/lib/utils'

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
      setPercent(latest * 100)
    })
    return () => unsubscribe()
  }, [smoothProgress])

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col items-start gap-1 font-mono text-sm mix-blend-difference md:bottom-12 md:right-12">
      <span className="flex items-baseline gap-1">
        <span className="text-xl font-bold md:text-2xl">{padTwo(percent)}</span>
        <span className="opacity-50">%</span>
      </span>
    </div>
  )
}
