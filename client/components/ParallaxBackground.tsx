'use client'

import { motion, useScroll, useSpring, useTransform } from "framer-motion"

export default function ParallaxBackground() {
  const { scrollYProgress } = useScroll()
  
  // Smooth the scroll progress for parallax
  const smoothProgress = useSpring(scrollYProgress, { 
    damping: 50, 
    stiffness: 100,
    restDelta: 0.001 
  })

  // Transformations based on scroll height
  const mountain3Y = useTransform(smoothProgress, [0, 0.5], ["0%", "70%"])
  const planetsX = useTransform(smoothProgress, [0, 0.5], ["0%", "-20%"])
  const mountain2Y = useTransform(smoothProgress, [0, 0.5], ["0%", "30%"])
  const mountain1Y = useTransform(smoothProgress, [0, 0.5], ["0%", "0%"])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="relative h-screen w-full">
        {/* Background Sky */}
        <div
          className="absolute inset-0 w-full h-screen"
          style={{
            backgroundImage: "url(/assets/sky.jpg)",
            backgroundPosition: "bottom",
            backgroundSize: "cover",
            zIndex: -50,
          }}
        />
        
        {/* Mountain Layer 3 - Deepest */}
        <motion.div
          className="absolute inset-0 w-full h-screen"
          style={{
            backgroundImage: "url(/assets/mountain-3.png)",
            backgroundPosition: "bottom",
            backgroundSize: "cover",
            zIndex: -40,
            y: mountain3Y,
          }}
        />
        
        {/* Planets - Moving horizontally for extra depth */}
        <motion.div
          className="absolute inset-0 w-full h-screen"
          style={{
            backgroundImage: "url(/assets/planets.png)",
            backgroundPosition: "bottom",
            backgroundSize: "cover",
            zIndex: -30,
            x: planetsX,
          }}
        />
        
        {/* Mountain Layer 2 */}
        <motion.div
          className="absolute inset-0 w-full h-screen"
          style={{
            backgroundImage: "url(/assets/mountain-2.png)",
            backgroundPosition: "bottom",
            backgroundSize: "cover",
            zIndex: -20,
            y: mountain2Y,
          }}
        />
        
        {/* Mountain Layer 1 - Foremost */}
        <motion.div
          className="absolute inset-0 w-full h-screen"
          style={{
            backgroundImage: "url(/assets/mountain-1.png)",
            backgroundPosition: "bottom",
            backgroundSize: "cover",
            zIndex: -10,
            y: mountain1Y,
          }}
        />

        {/* Ambient Dark Overlay to match editorial theme */}
        <div className="absolute inset-0 bg-black/30 z-0" />
      </div>
    </div>
  )
}
