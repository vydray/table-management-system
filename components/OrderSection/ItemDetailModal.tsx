import React from 'react'

interface OrderItem {
  name: string
  cast?: string
  quantity: number
  price: number
}

interface ItemDetailModalProps {
  item: OrderItem | null
  isOpen: boolean
  onClose: () => void
  onUpdateQuantity: (newQuantity: number) => void
  onDelete: () => void
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateQuantity,
  onDelete
}) => {
  if (!isOpen || !item) return null

  return (
    <div 
      className="item-detail-modal" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="item-detail-content">
        <h3>{item.name}</h3>
        {item.cast && (
          <p className="cast-info">キャスト: {item.cast}</p>
        )}
        
        <div className="detail-row">
          <label>個数:</label>
          <select 
            value={item.quantity}
            onChange={(e) => {
              onUpdateQuantity(parseInt(e.target.value))
            }}
            className="quantity-select"
          >
            {[1,2,3,4,5,6,7,8,9,10,15,20,30,50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        
        <div className="detail-row">
          <label>単価:</label>
          <span>¥{item.price.toLocaleString()}</span>
        </div>
        
        <div className="detail-row total">
          <label>小計:</label>
          <span>¥{(item.price * item.quantity).toLocaleString()}</span>
        </div>
        
        <div className="button-group">
          <button 
            className="delete-button"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            削除
          </button>
          
          <button 
            className="close-button"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}