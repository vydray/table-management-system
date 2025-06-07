import React, { useState } from 'react'
import { OrderItem } from '../../types'

interface ItemDetailModalProps {
  item: OrderItem
  index: number
  onClose: () => void
  onUpdateQuantity: (index: number, quantity: number) => void
  onDelete: (index: number) => void
  onUpdatePrice?: (index: number, price: number) => void  // 追加
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  index,
  onClose,
  onUpdateQuantity,
  onDelete,
  onUpdatePrice  // 追加
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [tempPrice, setTempPrice] = useState(item.price.toString())

  const handlePriceSubmit = () => {
    const newPrice = parseInt(tempPrice)
    if (!isNaN(newPrice) && newPrice > 0 && onUpdatePrice) {
      onUpdatePrice(index, newPrice)
      setIsEditingPrice(false)
    }
  }

  return (
    <div 
      className="item-detail-modal" 
      onClick={onClose}
      style={{ WebkitTransform: 'translateZ(0)' }}
    >
      <div className="item-detail-content" onClick={(e) => e.stopPropagation()}>
        <h3>{item.name}</h3>
        {item.cast && (
          <p className="cast-info">キャスト: {item.cast}</p>
        )}
        
        <div className="detail-row">
          <label>単価:</label>
          {isEditingPrice ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>¥</span>
              <input
                type="number"
                value={tempPrice}
                onChange={(e) => setTempPrice(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handlePriceSubmit()
                }}
                style={{
                  width: '100px',
                  padding: '5px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                autoFocus
              />
              <button 
                onClick={handlePriceSubmit}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
              <button 
                onClick={() => {
                  setIsEditingPrice(false)
                  setTempPrice(item.price.toString())
                }}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          ) : (
            <span 
              onClick={() => setIsEditingPrice(true)}
              style={{ 
                cursor: 'pointer',
                textDecoration: 'underline',
                color: '#0066cc'
              }}
            >
              ¥{item.price.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="detail-row">
          <label>個数:</label>
          <select 
            className="quantity-select"
            value={item.quantity}
            onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value))}
          >
            {[1,2,3,4,5,6,7,8,9,10,15,20,30,50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        
        <div className="detail-row total">
          <label>小計:</label>
          <span>¥{(item.price * item.quantity).toLocaleString()}</span>
        </div>
        
        <div className="button-group">
          <button 
            className="delete-button"
            onClick={() => {
              onDelete(index)
              onClose()
            }}
          >
            削除
          </button>
          <button className="close-button" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}