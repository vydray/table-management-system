import React from 'react'
import { useSwipeToDelete } from '../../hooks/useSwipeToDelete'

interface OrderItem {
  name: string
  cast?: string[]
  quantity: number
  price: number
}

interface OrderTableProps {
  orderItems: OrderItem[]
  onItemClick: (index: number) => void
  onItemDelete: (index: number) => void
  onUpdateQuantity?: (index: number, quantity: number) => void
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orderItems,
  onItemClick,
  onItemDelete,
  onUpdateQuantity
}) => {
  const {
    getSwipeState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseLeave
  } = useSwipeToDelete(onItemDelete)

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
          const swipeState = getSwipeState(index)
          
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
                  handleTouchStart(index, touch.clientX)
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0]
                  handleTouchMove(index, touch.clientX)
                }}
                onTouchEnd={() => handleTouchEnd(index)}
                onMouseDown={(e) => handleTouchStart(index, e.clientX)}
                onMouseMove={(e) => handleTouchMove(index, e.clientX)}
                onMouseUp={() => handleTouchEnd(index)}
                onMouseLeave={() => handleMouseLeave(index)}
              >
                <span className="col-name">{item.name}</span>
                <span className="col-cast">{item.cast && item.cast.length > 0 ? item.cast.join(', ') : ''}</span>
                <span className="col-qty">
                  {onUpdateQuantity ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.quantity > 1) {
                            onUpdateQuantity(index, item.quantity - 1)
                          }
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: item.quantity <= 1 ? '#e0e0e0' : '#ff9800',
                          color: item.quantity <= 1 ? '#999' : 'white',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateQuantity(index, item.quantity + 1)
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    item.quantity
                  )}
                </span>
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