import React, { useState } from 'react'

interface OrderItem {
  name: string
  cast?: string
  quantity: number
  price: number
}

interface OrderTableProps {
  orderItems: OrderItem[]
  onItemClick: (index: number) => void
  onItemDelete: (index: number) => void
}

export const OrderTable: React.FC<OrderTableProps> = ({ 
  orderItems, 
  onItemClick, 
  onItemDelete 
}) => {
  const [swipeStates, setSwipeStates] = useState<{
    [key: number]: {
      translateX: number
      isSwiping: boolean
      startX: number
    }
  }>({})

  return (
    <div className="order-table">
      <div className="order-table-header">
        <span className="col-name">商品名</span>
        <span className="col-cast">キャスト名</span>
        <span className="col-qty">個数</span>
        <span className="col-price">値段</span>
      </div>
      <div className="order-table-body">
        {orderItems.map((item, index) => {
          const swipeState = swipeStates[index] || { 
            translateX: 0, 
            isSwiping: false, 
            startX: 0 
          }
          
          return (
            <div 
              key={index} 
              className="order-table-row-wrapper"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div 
                className="order-table-row"
                style={{
                  transform: `translateX(${swipeState.translateX}px)`,
                  transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (Math.abs(swipeState.translateX) < 5) {
                    onItemClick(index)
                  }
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0]
                  setSwipeStates(prev => ({
                    ...prev,
                    [index]: { 
                      ...prev[index], 
                      startX: touch.clientX, 
                      isSwiping: true, 
                      translateX: 0 
                    }
                  }))
                }}
                onTouchMove={(e) => {
                  if (!swipeStates[index]?.isSwiping) return
                  const touch = e.touches[0]
                  const diffX = touch.clientX - (swipeStates[index]?.startX || 0)
                  if (diffX < 0) {
                    setSwipeStates(prev => ({
                      ...prev,
                      [index]: { 
                        ...prev[index], 
                        translateX: Math.max(diffX, -100) 
                      }
                    }))
                  }
                }}
                onTouchEnd={() => {
                  const currentState = swipeStates[index]
                  if (currentState?.translateX < -50) {
                    onItemDelete(index)
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
                }}
                onMouseDown={(e) => {
                  setSwipeStates(prev => ({
                    ...prev,
                    [index]: { 
                      ...prev[index], 
                      startX: e.clientX, 
                      isSwiping: true, 
                      translateX: 0 
                    }
                  }))
                }}
                onMouseMove={(e) => {
                  if (!swipeStates[index]?.isSwiping) return
                  const diffX = e.clientX - (swipeStates[index]?.startX || 0)
                  if (diffX < 0) {
                    setSwipeStates(prev => ({
                      ...prev,
                      [index]: { 
                        ...prev[index], 
                        translateX: Math.max(diffX, -100) 
                      }
                    }))
                  }
                }}
                onMouseUp={() => {
                  const currentState = swipeStates[index]
                  if (currentState?.translateX < -50) {
                    onItemDelete(index)
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
                }}
                onMouseLeave={() => {
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
                }}
              >
                <span className="col-name">{item.name}</span>
                <span className="col-cast">{item.cast || ''}</span>
                <span className="col-qty">{item.quantity}</span>
                <span className="col-price">
                  ¥{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
              <div 
                className="delete-indicator"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '80px',
                  background: '#f44336',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: Math.min(Math.abs(swipeState.translateX) / 100, 1),
                  zIndex: -1
                }}
              >
                削除
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}