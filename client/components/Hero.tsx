'use client'

import React, { Suspense, useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Html, useProgress } from "@react-three/drei"
import { motion } from "framer-motion"
import { easing } from "maath"
import { useMediaQuery } from "react-responsive"
import { Astronaut } from "./Astronaut"
import ParallaxBackground from "./ParallaxBackground"
import { FlipWords } from "./ui/flip-words"
import { EncryptedText } from "./ui/encrypted-text"

function Loader() {
  const { progress } = useProgress()
  return <Html center className="text-white font-mono text-sm uppercase tracking-widest">{progress.toFixed(0)}% LOADED</Html>
}

function Rig() {
  return useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [state.mouse.x / 10, 1 + state.mouse.y / 10, 3],
      0.5,
      delta
    )
  })
}

// ─── 3D Cube Flip ──────────────────────────────────────────────
// Uses inline styles to avoid Tailwind/framer-motion 3D conflicts.
// Each face is an independent motion.div with its own rotateX.
const CubeFlip = React.forwardRef<
  { remeasure: () => void },
  {
    children: React.ReactNode
    backContent: React.ReactNode
    isHovered: boolean
  }
>(({ children, backContent, isHovered }, ref) => {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(0)

  const measure = () => {
    const frontH = frontRef.current?.offsetHeight || 0
    const backH = backRef.current?.offsetHeight || 0
    setH(Math.max(frontH, backH))
  }

  React.useImperativeHandle(ref, () => ({ remeasure: measure }))

  useEffect(() => {
    measure()
    const timeout = setTimeout(measure, 500)
    const timeout2 = setTimeout(measure, 3000)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const half = h / 2

  return (
    <div
      style={{
        height: h || 'auto',
        perspective: '1200px',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Front Face */}
      <motion.div
        style={{
          position: 'absolute',
          width: '100%',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          transformOrigin: `center ${half}px`,
        }}
        animate={{
          rotateX: isHovered ? -90 : 0,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div ref={frontRef}>{children}</div>
      </motion.div>

      {/* Top Face — starts rotated 90° above, flips down into view */}
      <motion.div
        style={{
          position: 'absolute',
          width: '100%',
          height: h || 'auto',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          transformOrigin: `center ${half}px`,
        }}
        animate={{
          rotateX: isHovered ? 0 : 90,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div ref={backRef}>{backContent}</div>
      </motion.div>
    </div>
  )
})
CubeFlip.displayName = 'CubeFlip'

const ROLES = [
  "Software Developer",
  "ML Engineer",
  "Bug Exorcist",
  "Caffeine Compiler",
  "Full-Stack Architect",
]

// ─── Hero Content ──────────────────────────────────────────────
// Hover ANYWHERE in this region triggers the cube flip.
// FlipWords stays visible below during the flip.
function HeroContent({ loaderDone }: { loaderDone: boolean }) {
  const [isHovered, setIsHovered] = useState(false)
  const cubeRef = useRef<{ remeasure: () => void }>(null)

  // Re-measure CubeFlip height when encrypted text renders
  useEffect(() => {
    if (loaderDone && cubeRef.current) {
      setTimeout(() => cubeRef.current?.remeasure(), 100)
    }
  }, [loaderDone])

  return (
    <div
      className="relative z-10 flex flex-col items-start w-full cursor-target"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Name with 3D Cube Flip */}
      <div className="w-full">
        <CubeFlip
          ref={cubeRef}
          isHovered={isHovered}
          backContent={
            <div className="flex items-center h-full w-fit">
              <div className="border-l-2 border-white/60 pl-6 md:pl-10 py-6">
                <p className="font-mono text-[4vw] md:text-[2.2vw] max-w-2xl lg:text-[1.8vw] leading-relaxed font-bold text-white lowercase">
                  i ship code faster than amazon ships packages.
                </p>
                <p className="font-mono text-[3vw] md:text-[1.6vw] lg:text-[1.2vw] leading-relaxed text-red-300 lowercase mt-3">
                  software developer · ml tinkerer · full-time bug bounty hunter
                </p>
              </div>
            </div>
          }
        >
          <h1 className="text-[14vw] font-black leading-[0.9] tracking-tighter md:text-[10vw] text-left text-white">
            {loaderDone ? (
              <>
                <EncryptedText
                  text="MIHIR"
                  revealDelayMs={80}
                  flipDelayMs={40}
                  className="inline-block"
                  encryptedClassName="opacity-40"
                />
                <br />
                <EncryptedText
                  text="PATIL"
                  revealDelayMs={80}
                  flipDelayMs={40}
                  className="inline-block"
                  encryptedClassName="opacity-40"
                />
              </>
            ) : (
              <span className="invisible">
                MIHIR<br />PATIL
              </span>
            )}
          </h1>
        </CubeFlip>
      </div>

      {/* Flip Words Role Cycler — always visible, even during flip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={loaderDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
        className="mt-6 md:mt-8 flex items-center gap-2"
      >
        <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-40">
          //
        </span>
        <FlipWords
          words={ROLES}
          duration={2500}
          className="font-mono text-sm md:text-base uppercase tracking-[0.2em] text-white/70 px-0"
        />
      </motion.div>
    </div>
  )
}

// Total PageLoader duration: ~2.7s
const LOADER_DURATION_MS = 2800

export default function Hero() {
  const [mounted, setMounted] = useState(false)
  const [loaderDone, setLoaderDone] = useState(false)
  const isMobile = useMediaQuery({ maxWidth: 853 })

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setLoaderDone(true), LOADER_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return <div className="min-h-screen bg-black" />

  return (
    <section id="hero" className="relative flex h-screen w-full flex-col justify-center overflow-hidden bg-black px-6 md:px-16 lg:px-24 py-12 md:py-20">
      {/* 1. Background Layers (Parallax) */}
      <ParallaxBackground />

      {/* 2. 3D Model Layer (Astronaut) */}
      <div className="absolute inset-0 z-5 h-full w-full pointer-events-none">
        <Canvas 
          camera={{ position: [0, 1, 3] }} 
          dpr={[1, 1.25]}
          gl={{ 
            powerPreference: "high-performance", 
            antialias: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            
            <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
              <Astronaut
                scale={isMobile ? 0.18 : 0.28}
                position={isMobile ? [0, -1.8, 0] : [1.5, -1.2, 0]}
              />
            </Float>
            
            <Rig />
          </Suspense>
        </Canvas>
      </div>

      {/* 3. Headline — hover anywhere triggers flip */}
      <HeroContent loaderDone={loaderDone} />

      {/* Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.05] contrast-150 brightness-100"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3Y%3Cfilter id='noiseFilter'%3Y%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </section>
  )
}
