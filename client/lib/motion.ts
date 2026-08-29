// lib/motion.ts
import { Variants, Transition } from 'framer-motion'

// ─── Base easings ─────────────────────────────────────────────
// Use these instead of strings like "easeOut" — more precise control
export const easings = {
  smooth:   [0.22, 1, 0.36, 1],      // expo out — the main one, snappy deceleration
  gentle:   [0.25, 0.46, 0.45, 0.94], // quad out — softer, for text
  spring:   [0.34, 1.56, 0.64, 1],    // slight overshoot — for cards, cursor
  inOut:    [0.65, 0, 0.35, 1],       // cubic in-out — for page transitions
} as const

// ─── Base transitions ──────────────────────────────────────────
export const transitions = {
  fast:   { duration: 0.35, ease: easings.smooth },
  medium: { duration: 0.6,  ease: easings.smooth },
  slow:   { duration: 0.9,  ease: easings.smooth },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
} satisfies Record<string, Transition>

// ─── Fade variants ─────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: transitions.medium },
}

// ─── Slide + fade variants ─────────────────────────────────────
// The main one — used on almost every text block and section
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: transitions.medium },
}

export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0, transition: transitions.medium },
}

export const fadeLeft: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: transitions.medium },
}

export const fadeRight: Variants = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: transitions.medium },
}

// ─── Stagger container ─────────────────────────────────────────
// Wrap a list of children in this — each child animates 0.1s after the last
// Usage: <motion.ul variants={stagger}> <motion.li variants={fadeUp}>
export const stagger: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerFast: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

// ─── Clip reveal ───────────────────────────────────────────────
// Text/image wipes in from bottom — the cinematic reveal effect
// Wrap content in overflow-hidden, apply this to the inner element
export const clipReveal: Variants = {
  hidden:  { clipPath: 'inset(100% 0% 0% 0%)' },
  visible: {
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.7, ease: easings.smooth },
  },
}

// ─── Scale variants ────────────────────────────────────────────
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: transitions.medium },
}

// For project cards on hover
export const cardHover = {
  rest:  { scale: 1,    transition: transitions.fast },
  hover: { scale: 1.02, transition: transitions.fast },
}

// ─── Word cycler variants ──────────────────────────────────────
// Used in WordCycler.tsx — word slides up out, next slides up in
export const wordExit: Variants = {
  initial: { y: 0,   opacity: 1 },
  animate: { y: 0,   opacity: 1 },
  exit:    { y: -60, opacity: 0, transition: { duration: 0.3, ease: easings.smooth } },
}

export const wordEnter: Variants = {
  initial: { y: 60,  opacity: 0 },
  animate: { y: 0,   opacity: 1, transition: { duration: 0.4, ease: easings.smooth } },
}

// ─── Page transition variants ──────────────────────────────────
// Applied at the page level in layout.tsx for route changes
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.smooth, delay: 0.1 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: easings.inOut },
  },
}

// ─── FUI dashboard variants ────────────────────────────────────
// Log lines animate in one by one
export const logLine: Variants = {
  hidden:  { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: easings.gentle } },
}

// ─── Helper: viewport settings ────────────────────────────────
// Pass this to whileInView — triggers once when 20% of element is visible
export const viewportOnce = { once: true, amount: 0.2 } as const