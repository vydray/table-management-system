import { FC, useState, useRef } from 'react'
import { TableData } from '../types'

interface TableProps {
  tableId: string
  data: TableData
  scale: number
  tableSize: { width: number, height: number }
  position: { top: number, left: number }
  moveMode: boolean
  moveFromTable: string
  isMoving: boolean
  showModal: boolean
  onOpenModal: (data: TableData) => void
  onStartMoveMode: (tableId: string) => void
  onExecuteMove: (tableId: string) => void
}

export const Table: FC<TableProps> = ({ 
  tableId,
  data,
  scale,
  tableSize,
  position,
  moveMode,
  moveFromTable,
  isMoving,
  showModal,
  onOpenModal,
  onStartMoveMode,
  onExecuteMove
}) => {
  const [startPos, setStartPos] = useState({ x: 0, y: 0, time: 0 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)
  
  const handleStart = (x: number, y: number) => {
    // モーダルが開いている場合は長押し機能を無効化
    if (showModal) {
      return;
    }
    
    // 振動フィードバック（Android対応）
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(10); // 10ms振動
      }
    } catch {
      // ブラウザで振動が許可されていない場合は無視
    }
    
    setStartPos({ x, y, time: Date.now() })
    
    if (data.status === 'occupied' && !moveMode) {
      longPressTimer.current = setTimeout(() => {
        if (!isLongPress.current) {
          isLongPress.current = true
          // 長押し成功時も振動
          try {
            if ('vibrate' in navigator) {
              navigator.vibrate(50); // 50ms振動
            }
          } catch {
            // ブラウザで振動が許可されていない場合は無視
          }
          onStartMoveMode(tableId)
        }
      }, 800)
    }
  }
  
  const handleMove = (x: number, y: number) => {
    const moveX = Math.abs(x - startPos.x)
    const moveY = Math.abs(y - startPos.y)
    
    if (moveX > 10 || moveY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }
  
  const handleEnd = () => {
    const elapsed = Date.now() - startPos.time
    
    if (elapsed < 500 && !isLongPress.current) {
      if (!moveMode && !showModal) {  // モーダルが開いていない時のみ
        onOpenModal(data)
      } else if (data.status === 'empty' && !isMoving) {
        onExecuteMove(tableId)
      }
    }
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    isLongPress.current = false
  }
  
  return (
    <div
      className={`table ${data.status} ${
        moveMode && moveFromTable === tableId ? 'lifting' : ''
      } ${
        moveMode && data.status === 'empty' ? 'move-target' : ''
      } ${
        moveMode && data.status === 'occupied' && tableId !== moveFromTable ? 'move-mode' : ''
      }`}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${tableSize.width}px`,
        height: `${tableSize.height}px`,
        padding: `${5 * scale}px`,
        borderRadius: `${16 * scale}px`,
        fontSize: `${20 * scale}px`,
        touchAction: 'manipulation'
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0]
        handleStart(touch.clientX, touch.clientY)
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0]
        handleMove(touch.clientX, touch.clientY)
      }}
      onTouchEnd={() => {
        handleEnd()
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        handleStart(e.clientX, e.clientY)
      }}
      onMouseMove={(e) => {
        if (longPressTimer.current) {
          handleMove(e.clientX, e.clientY)
        }
      }}
      onMouseUp={(e) => {
        e.preventDefault()
        handleEnd()
      }}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }}
    >
      <div className="table-name" style={{ fontSize: `${36 * scale}px`, fontWeight: 'bold' }}>
        {tableId} {data.visit && data.status === 'occupied' ? data.visit : ''}
      </div>
      <div className="table-info" style={{ fontSize: `${26 * scale}px` }}>
        {data.status === 'empty' ? (
          <small style={{ fontSize: `${24 * scale}px` }}>空席</small>
        ) : (
          <>
            <strong style={{ fontSize: `${28 * scale}px` }}>{data.name}</strong>
            <span style={{ fontSize: `${24 * scale}px` }}>推し: {data.oshi}</span>
            <div className="table-elapsed" style={{ fontSize: `${26 * scale}px`, fontWeight: 'bold', marginTop: `${4 * scale}px` }}>{data.elapsed}</div>
          </>
        )}
      </div>
    </div>
  )
}