import React, { useState, useEffect } from 'react'  // useEffectを追加
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

  // ここに追加：モーダルが開いたときにスクロール位置を固定
  useEffect(() => {
    // 現在のスクロール位置を保存
    const scrollY = window.scrollY;
    
    // bodyのスクロールを無効化
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // クリーンアップ関数
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

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