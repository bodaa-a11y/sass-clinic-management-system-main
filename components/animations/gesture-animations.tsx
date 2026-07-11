/**
 * Gesture Animations Component
 * حركات اللمس للموبايل مثل Healthie
 */

'use client'

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface SwipeableProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  swipeThreshold?: number
  className?: string
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 50,
  className,
}: SwipeableProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      // Horizontal swipe
      if (info.offset.x > swipeThreshold && onSwipeRight) {
        onSwipeRight()
      } else if (info.offset.x < -swipeThreshold && onSwipeLeft) {
        onSwipeLeft()
      }
    } else {
      // Vertical swipe
      if (info.offset.y > swipeThreshold && onSwipeDown) {
        onSwipeDown()
      } else if (info.offset.y < -swipeThreshold && onSwipeUp) {
        onSwipeUp()
      }
    }

    // Reset position
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      style={{ x, y }}
      onDragEnd={handleDragEnd}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 100,
  className,
}: PullToRefreshProps) {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, threshold], [0, 1])
  const scale = useTransform(y, [0, threshold], [0.8, 1])
  const isRefreshing = useRef(false)

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing.current) {
      isRefreshing.current = true
      await onRefresh()
      isRefreshing.current = false
    }
    y.set(0)
  }

  return (
    <motion.div
      style={{ y }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      className={className}
    >
      <motion.div
        style={{ opacity, scale }}
        className="flex items-center justify-center h-16"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ↻
        </motion.div>
      </motion.div>
      {children}
    </motion.div>
  )
}

interface PinchToZoomProps {
  children: ReactNode
  minScale?: number
  maxScale?: number
  className?: string
}

export function PinchToZoom({
  children,
  minScale = 0.5,
  maxScale = 3,
  className,
}: PinchToZoomProps) {
  const scale = useMotionValue(1)

  return (
    <motion.div
      style={{ scale }}
      className={className}
      whileTap={{ cursor: 'grabbing' }}
    >
      {children}
    </motion.div>
  )
}

interface SwipeToDeleteProps {
  children: ReactNode
  onDelete: () => void
  className?: string
}

export function SwipeToDelete({ children, onDelete, className }: SwipeToDeleteProps) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0], [1, 0])
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0])
  const deleteScale = useTransform(x, [-100, -50], [1, 0.8])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete()
    } else {
      x.set(0)
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{ opacity: deleteOpacity, scale: deleteScale }}
        className="absolute inset-0 bg-rose-error flex items-center justify-center"
      >
        <span className="text-white font-semibold">حذف</span>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        style={{ x, opacity }}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}

interface SwipeActionProps {
  children: ReactNode
  leftAction?: { icon: ReactNode; label: string; onAction: () => void }
  rightAction?: { icon: ReactNode; label: string; onAction: () => void }
  className?: string
}

export function SwipeAction({
  children,
  leftAction,
  rightAction,
  className,
}: SwipeActionProps) {
  const x = useMotionValue(0)
  const leftOpacity = useTransform(x, [0, 100], [0, 1])
  const rightOpacity = useTransform(x, [0, -100], [0, 1])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100 && leftAction) {
      leftAction.onAction()
      x.set(0)
    } else if (info.offset.x < -100 && rightAction) {
      rightAction.onAction()
      x.set(0)
    } else {
      x.set(0)
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {leftAction && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute inset-0 bg-emerald-success flex items-center justify-end pr-4 gap-2"
        >
          {leftAction.icon}
          <span className="text-white font-semibold">{leftAction.label}</span>
        </motion.div>
      )}
      {rightAction && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute inset-0 bg-medical-blue flex items-center justify-start pl-4 gap-2"
        >
          <span className="text-white font-semibold">{rightAction.label}</span>
          {rightAction.icon}
        </motion.div>
      )}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        style={{ x }}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}
