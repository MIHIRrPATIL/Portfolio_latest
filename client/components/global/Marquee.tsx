'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  speed?: number
  reverse?: boolean
  className?: string
}

export default function Marquee({
  children,
  speed = 20,
  reverse = false,
  className
}: MarqueeProps) {
  return (
    <div className={`flex overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        animate={{
          x: reverse ? [0, 1000] : [0, -1000]
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear"
        }}
        className="flex"
      >
        <div className="flex pr-4">{children}</div>
        <div className="flex pr-4">{children}</div>
        <div className="flex pr-4">{children}</div>
        <div className="flex pr-4">{children}</div>
      </motion.div>
    </div>
  )
}
