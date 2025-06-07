import React from 'react'
import { OrderItem } from '../../types'

interface ItemDetailModalProps {
  item: OrderItem
  index: number
  onClose: () => void
  onUpdateQuantity: (index: number, quantity: number) => void
  onDelete: (index: number) => void
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  index,
  onClose,
  onUpdateQuantity,
  onDelete
}) => {
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
          <span>¥{item.price.toLocaleString()}</span>
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