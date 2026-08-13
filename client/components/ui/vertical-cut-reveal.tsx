import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { AnimationOptions, motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface TextProps {
  children: React.ReactNode
  reverse?: boolean
  transition?: AnimationOptions
  splitBy?: "words" | "characters" | "lines" | string
  staggerDuration?: number
  staggerFrom?: "first" | "last" | "center" | "random" | number
  containerClassName?: string
  wordLevelClassName?: string
  elementLevelClassName?: string
  onClick?: () => void
  onStart?: () => void
  onComplete?: () => void
  autoStart?: boolean
}

export interface VerticalCutRevealRef {
  startAnimation: () => void
  reset: () => void
}

interface RevealPart {
  text: string
  className?: string
  needsSpace: boolean
  characters: { char: string; index: number }[]
}

const VerticalCutReveal = forwardRef<VerticalCutRevealRef, TextProps>(
  (
    {
      children,
      reverse = false,
      transition = {
        type: "spring",
        stiffness: 190,
        damping: 22,
      },
      splitBy = "words",
      staggerDuration = 0.2,
      staggerFrom = "first",
      containerClassName,
      wordLevelClassName,
      elementLevelClassName,
      onClick,
      onStart,
      onComplete,
      autoStart = true,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLSpanElement>(null)
    const [isAnimating, setIsAnimating] = useState(false)

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
        return Array.from(segmenter.segment(text), ({ segment }) => segment)
      }
      return Array.from(text)
    }

    const { parts, fullText, totalCount } = useMemo(() => {
      const result: RevealPart[] = []
      let charCounter = 0
      let wordCounter = 0
      let rawText = ""

      const processNode = (node: React.ReactNode, parentClassName?: string) => {
        React.Children.forEach(node, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            const str = child.toString()
            rawText += str
            const words = str.split(" ")
            words.forEach((word, i) => {
              if (word || i !== words.length - 1) {
                const chars = splitIntoCharacters(word).map((char) => ({
                  char,
                  index: charCounter++,
                }))
                result.push({
                  text: word,
                  className: parentClassName,
                  needsSpace: i !== words.length - 1,
                  characters: chars,
                })
                wordCounter++
              }
            })
          } else if (React.isValidElement(child)) {
            processNode(
              (child.props as any).children,
              cn(parentClassName, (child.props as any).className)
            )
          }
        })
      }

      processNode(children)
      return {
        parts: result,
        fullText: rawText,
        totalCount: splitBy === "characters" ? charCounter : wordCounter,
      }
    }, [children, splitBy])

    const getStaggerDelay = useCallback(
      (index: number) => {
        if (staggerFrom === "first") return index * staggerDuration
        if (staggerFrom === "last") return (totalCount - 1 - index) * staggerDuration
        if (staggerFrom === "center") {
          const center = Math.floor(totalCount / 2)
          return Math.abs(center - index) * staggerDuration
        }
        if (staggerFrom === "random") {
          const randomIndex = Math.floor(Math.random() * totalCount)
          return Math.abs(randomIndex - index) * staggerDuration
        }
        return Math.abs((staggerFrom as number) - index) * staggerDuration
      },
      [totalCount, staggerFrom, staggerDuration]
    )

    const startAnimation = useCallback(() => {
      setIsAnimating(true)
      onStart?.()
    }, [onStart])

    useImperativeHandle(ref, () => ({
      startAnimation,
      reset: () => setIsAnimating(false),
    }))

    const isInView = useInView(containerRef, {
      once: true,
      amount: 0.05, // Trigger when 5% of the element is visible
    })

    useEffect(() => {
      if (autoStart && isInView) {
        startAnimation()
      }
    }, [autoStart, isInView, startAnimation])

    const variants = {
      hidden: { y: reverse ? "-100%" : "100%" },
      visible: (i: number) => ({
        y: 0,
        transition: {
          ...transition,
          delay: ((transition?.delay as number) || 0) + getStaggerDelay(i),
        },
      }),
    }

    return (
      <span
        className={cn(
          containerClassName,
          "flex flex-wrap whitespace-pre-wrap",
          splitBy === "lines" && "flex-col"
        )}
        onClick={onClick}
        ref={containerRef}
        {...props}
      >
        <span className="sr-only">{fullText}</span>

        {parts.map((part, partIndex) => (
          <span
            key={partIndex}
            aria-hidden="true"
            className={cn("inline-flex overflow-hidden", wordLevelClassName, part.className)}
          >
            {part.characters.map((charObj, charIndex) => (
              <span
                className={cn(
                  elementLevelClassName,
                  "whitespace-pre-wrap relative"
                )}
                key={charIndex}
              >
                <motion.span
                  custom={splitBy === "characters" ? charObj.index : partIndex}
                  initial="hidden"
                  animate={isAnimating ? "visible" : "hidden"}
                  variants={variants}
                  onAnimationComplete={
                    partIndex === parts.length - 1 &&
                    charIndex === part.characters.length - 1
                      ? onComplete
                      : undefined
                  }
                  className="inline-block"
                >
                  {charObj.char}
                </motion.span>
              </span>
            ))}
            {part.needsSpace && <span> </span>}
          </span>
        ))}
      </span>
    )
  }
)

VerticalCutReveal.displayName = "VerticalCutReveal"

export { VerticalCutReveal }