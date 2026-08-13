'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PageLoader() {
  const [count, setCount]       = useState(0)
  const [visible, setVisible]   = useState(true)
  const [counting, setCounting] = useState(false)

  useEffect(() => {
    // Lock scroll while loader is active
    document.body.style.overflow = 'hidden'

    const startDelay = setTimeout(() => {
      setCounting(true)
    }, 200)

    return () => {
      clearTimeout(startDelay)
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!counting) return

    const totalSteps = 100
    const duration = 1200
    const stepTime = duration / totalSteps

    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setVisible(false)
          return 100
        }
        return prev + 1
      })
    }, stepTime)

    return () => clearInterval(timer)
  }, [counting])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-white flex items-end p-12 rounded-b-3xl"
          style={{ pointerEvents: 'none' }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={() => {
            document.body.style.overflow = ''
          }}
        >
          <motion.span
            className="font-orbitron text-8xl md:text-[10rem] font-black text-black tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            animate={{ opacity: count === 100 ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {count < 10 ? `0${count}` : count}
            <span className="text-4xl ml-2 opacity-50">%</span>
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}