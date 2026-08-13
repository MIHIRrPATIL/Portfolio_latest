import { type HTMLMotionProps, motion, useInView } from "motion/react"
import React, { useRef } from "react"
import type { Variants } from "motion/react"

type TimelineContentProps<T extends keyof HTMLElementTagNameMap> = {
  children?: React.ReactNode
  animationNum: number
  className?: string
  timelineRef: React.RefObject<HTMLElement | null>
  as?: T
  customVariants?: Variants
  once?: boolean
} & HTMLMotionProps<T>

export const TimelineContent = <T extends keyof HTMLElementTagNameMap = "div">({
  children,
  animationNum,
  timelineRef,
  className,
  as,
  customVariants,
  once=false,
  ...props
}: TimelineContentProps<T>) => {
  const defaultSequenceVariants = {
    visible: (i: number) => ({
      filter: "blur(0px)",
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(20px)",
      y: 0,
      opacity: 0,
    },
  }

  // Use custom variants if provided, otherwise use default
  const sequenceVariants = customVariants || defaultSequenceVariants

  const internalRef = useRef(null)
  const isInView = useInView(internalRef, {
    once,
    amount: 0.05
  })

  const MotionComponent = (motion as any)[as || "div"]

  return (
    <MotionComponent
      ref={internalRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={sequenceVariants}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}