import React, { useState, useEffect } from 'react'
import { OrderItem } from '../../types'

interface ItemDetailModalProps {
  item: OrderItem
  index: number
  onClose: () => void
  onUpdateQuantity: (index: number, quantity: number) => void
  onDelete: (index: number) => void
  onUpdatePrice?: (index: number, price: number) => void
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  index,
  onClose,
  onUpdateQuantity,
  onDelete,
  onUpdatePrice
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [tempPrice, setTempPrice] = useState(item.price.toString())
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(item.quantity.toString())

  useEffect(() => {
    // モーダルが開いたときにbodyのスクロールを無効化
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width
    
    // iOSでのスクロール固定
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    
    return () => {
      // モーダルが閉じたときに元に戻す
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

  const handlePriceSubmit = () => {
    const newPrice = parseInt(tempPrice)
    if (!isNaN(newPrice) && newPrice > 0 && onUpdatePrice) {
      onUpdatePrice(index, newPrice)
      setIsEditingPrice(false)
    }
  }

  const handleQuantitySubmit = () => {
    const newQuantity = parseInt(tempQuantity)
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(index, newQuantity)
      setIsEditingQuantity(false)
    }
  }

  return (
    <div className="item-detail-modal">
      <div 
        className="item-detail-content"
        onClick={(e) => e.stopPropagation()}
      >
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
          {isEditingQuantity ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={tempQuantity}
                onChange={(e) => setTempQuantity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleQuantitySubmit()
                }}
                style={{
                  width: '80px',
                  padding: '5px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                min="1"
                autoFocus
              />
              <button 
                onClick={handleQuantitySubmit}
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
                  setIsEditingQuantity(false)
                  setTempQuantity(item.quantity.toString())
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
              onClick={() => setIsEditingQuantity(true)}
              style={{ 
                cursor: 'pointer',
                textDecoration: 'underline',
                color: '#0066cc',
                padding: '5px 10px',
                display: 'inline-block'
              }}
            >
              {item.quantity}
            </span>
          )}
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