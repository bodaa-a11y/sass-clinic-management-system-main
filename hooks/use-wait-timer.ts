import { useState, useEffect } from 'react'

export function useWaitTimer(checkInTime: string, thresholdMinutes: number = 30) {
  const [waitMinutes, setWaitMinutes] = useState(0)
  const [isOverThreshold, setIsOverThreshold] = useState(false)

  useEffect(() => {
    const calculateWaitTime = () => {
      const now = new Date()
      const checkIn = new Date(checkInTime)
      const diffMs = now.getTime() - checkIn.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      setWaitMinutes(diffMinutes)
      setIsOverThreshold(diffMinutes > thresholdMinutes)
    }

    // Calculate immediately
    calculateWaitTime()

    // Update every minute
    const interval = setInterval(calculateWaitTime, 60000)

    return () => clearInterval(interval)
  }, [checkInTime, thresholdMinutes])

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} دقيقة`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}:${mins} ساعة` : `${hours} ساعة`
  }

  return {
    waitMinutes,
    isOverThreshold,
    formattedWaitTime: formatWaitTime(waitMinutes)
  }
}
