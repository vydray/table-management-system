import { useState } from 'react'

interface SwipeState {
  translateX: number
  isSwiping: boolean
  startX: number
}

export const useSwipeToDelete = (onDelete: (index: number) => void) => {
  const [swipeStates, setSwipeStates] = useState<{
    [key: number]: SwipeState
  }>({})

  // タッチスタート
  const handleTouchStart = (index: number, clientX: number) => {
    setSwipeStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        startX: clientX,
        isSwiping: true,
        translateX: 0
      }
    }))
  }

  // タッチムーブ
  const handleTouchMove = (index: number, clientX: number) => {
    if (!swipeStates[index]?.isSwiping) return
    const diffX = clientX - (swipeStates[index]?.startX || 0)
    if (diffX < 0) {
      setSwipeStates(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          translateX: Math.max(diffX, -100)
        }
      }))
    }
  }

  // タッチエンド
  const handleTouchEnd = (index: number) => {
    const currentState = swipeStates[index]
    if (currentState?.translateX < -50) {
      onDelete(index)
      setSwipeStates(prev => {
        const newStates = { ...prev }
        delete newStates[index]
        return newStates
      })
    } else {
      setSwipeStates(prev => ({
        ...prev,
        [index]: {
          translateX: 0,
          isSwiping: false,
          startX: 0
        }
      }))
    }
  }

  // マウスリーブ（キャンセル）
  const handleMouseLeave = (index: number) => {
    if (swipeStates[index]?.isSwiping) {
      setSwipeStates(prev => ({
        ...prev,
        [index]: {
          translateX: 0,
          isSwiping: false,
          startX: 0
        }
      }))
    }
  }

  // スワイプ状態を取得
  const getSwipeState = (index: number): SwipeState => {
    return swipeStates[index] || {
      translateX: 0,
      isSwiping: false,
      startX: 0
    }
  }

  return {
    swipeStates,
    getSwipeState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseLeave
  }
}
