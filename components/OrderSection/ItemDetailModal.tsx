import React, { useState, useEffect, useRef } from 'react'
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
  const [overlayHeight, setOverlayHeight] = useState('100vh')
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 親モーダルの高さを取得
    const parentModal = document.getElementById('modal')
    if (parentModal) {
      const scrollHeight = parentModal.scrollHeight
      const windowHeight = window.innerHeight
      
      // 親モーダルの高さと画面の高さの大きい方を使用
      const height = Math.max(scrollHeight, windowHeight)
      setOverlayHeight(`${height}px`)
    }

    // 初期位置を設定
    updateModalPosition()

    // スクロールイベントを監視
    const handleScroll = () => {
      updateModalPosition()
    }

    // 親モーダルのスクロールを監視
    if (parentModal) {
      parentModal.addEventListener('scroll', handleScroll)
      return () => {
        parentModal.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const updateModalPosition = () => {
    const parentModal = document.getElementById('modal')
    if (parentModal && modalContentRef.current) {
      const parentRect = parentModal.getBoundingClientRect()
      const scrollTop = parentModal.scrollTop
      
      // ビューポートの中央を計算
      const viewportCenterY = window.innerHeight / 2
      const modalTop = scrollTop + viewportCenterY
      
      modalContentRef.current.style.top = `${modalTop}px`
    }
  }

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
    <>
      {/* 背景オーバーレイ（親モーダルの高さに合わせる） */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: overlayHeight,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998
        }}
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ（スクロールに追従） */}
      <div 
        ref={modalContentRef}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          transition: 'top 0.3s ease-out'
        }}
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
    </>
  )
}