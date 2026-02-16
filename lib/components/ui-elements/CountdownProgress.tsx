"use client"

import { useEffect, useState, useCallback, useRef, memo } from "react"
import { cn } from "@/lib/utils/utils"
import { useSpring, animated } from "@react-spring/web"
import { useDevice } from "@/lib/hooks/useDevice"
import { useEcceDialog } from "../ecce-elements"

/** Auto-refresh interval in seconds */
const AUTO_REFRESH_INTERVAL_SECONDS = 30

/** Update interval for smooth progress animation (in ms) 
 * Reduced from 100ms to 250ms to minimize re-renders while maintaining smooth animation.
 * CSS transitions handle the visual smoothing between updates.
 */
const PROGRESS_UPDATE_INTERVAL_MS = 250

interface CountdownProgressProps {
  /** Callback fired when countdown reaches zero */
  onComplete: () => void
  /** Increment this value to reset the countdown (e.g., when user manually refreshes) */
  resetTrigger: number
  /** Whether to pause the countdown (e.g., during loading) */
  isPaused?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Circular countdown progress indicator with timer
 * 
 * Displays a filling circular progress bar with countdown text.
 * Resets when resetTrigger changes or when countdown completes.
 * 
 * Memoized to prevent unnecessary parent re-renders from frequent state updates.
 */
const CountdownProgressComponent = ({
  onComplete,
  resetTrigger,
  isPaused = false,
  className,
}: CountdownProgressProps) => {
  const { deviceType } = useDevice()
  const { openDialogId } = useEcceDialog()
  const [remainingSeconds, setRemainingSeconds] = useState(AUTO_REFRESH_INTERVAL_SECONDS)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const onCompleteRef = useRef(onComplete)
  
  // Keep callback ref updated without causing effect re-runs
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset timer when resetTrigger changes
  useEffect(() => {
    startTimeRef.current = Date.now()
    setRemainingSeconds(AUTO_REFRESH_INTERVAL_SECONDS)
    setProgress(0)
  }, [resetTrigger])

  // Main countdown effect
  useEffect(() => {
    if (isPaused) return

    const intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, AUTO_REFRESH_INTERVAL_SECONDS - elapsed)
      const currentProgress = Math.min(100, (elapsed / AUTO_REFRESH_INTERVAL_SECONDS) * 100)
      
      setRemainingSeconds(Math.ceil(remaining))
      setProgress(currentProgress)
      
      if (remaining <= 0) {
        // Reset for next cycle
        startTimeRef.current = Date.now()
        setRemainingSeconds(AUTO_REFRESH_INTERVAL_SECONDS)
        setProgress(0)
        onCompleteRef.current()
      }
    }, PROGRESS_UPDATE_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [isPaused])

  // SVG circle properties
  const size = 32
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const opacitySpring = useSpring({
    opacity: deviceType === 'mobile' && openDialogId && ["submit-request"].includes(openDialogId) ? 0 : 1,
    config: { tension: 2100, friction: 210 },
  })

  return (
    <animated.div 
      style={opacitySpring}
      className={cn(
        "safe-area-content fixed bottom-52 md:bottom-6 right-8 left-auto md:left-6 flex gap-2 pointer-events-none z-100",
        // "bottom-[180px]",
        className
      )}
    >
      {/* Circular progress indicator */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-foreground/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            className="text-foreground/60 transition-[stroke-dashoffset] duration-250 ease-linear"
          />
        </svg>
      </div>
      
      {/* Countdown text */}
      {/* <span className="text-sm text-muted-foreground font-mono tabular-nums min-w-[2ch]">
        {remainingSeconds}
      </span> */}
    </animated.div>
  )
}

/**
 * Memoized export to prevent parent re-renders from frequent internal state updates.
 * Only re-renders when props actually change.
 */
export const CountdownProgress = memo(CountdownProgressComponent)
