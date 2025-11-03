import { useState, useEffect, RefObject } from 'react'

interface CanvasSize {
  width: number
  height: number
}

export const useAutoScale = (
  canvasRef: RefObject<HTMLDivElement | null>,
  canvasSize: CanvasSize
) => {
  const [autoScale, setAutoScale] = useState(1)

  useEffect(() => {
    const calculateAutoScale = () => {
      if (canvasRef.current) {
        const container = canvasRef.current
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        const scaleX = (containerWidth - 40) / canvasSize.width
        const scaleY = (containerHeight - 40) / canvasSize.height
        const scale = Math.min(scaleX, scaleY, 1)

        setAutoScale(scale)
      }
    }

    calculateAutoScale()
    window.addEventListener('resize', calculateAutoScale)
    return () => window.removeEventListener('resize', calculateAutoScale)
  }, [canvasSize.width, canvasSize.height, canvasRef])

  return autoScale
}
