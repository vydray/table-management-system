import React from 'react'
import { OrderItem } from '../../types'
import { useItemEditing } from '../../hooks/useItemEditing'
import { useModalPosition } from '../../hooks/useModalPosition'
import { NumericInput } from '../NumericInput'

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
  const modalContentRef = useModalPosition()

  const {
    isEditingPrice,
    setIsEditingPrice,
    tempPrice,
    setTempPrice,
    handlePriceSubmit,
    cancelPriceEdit,
    isEditingQuantity,
    setIsEditingQuantity,
    tempQuantity,
    setTempQuantity,
    handleQuantitySubmit,
    cancelQuantityEdit
  } = useItemEditing(item.price, item.quantity, index, onUpdatePrice, onUpdateQuantity)

  return (
    <div className="item-detail-modal" onClick={onClose}>
      <div
        ref={modalContentRef}
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
              <div style={{ flex: 1 }}>
                <NumericInput
                  value={tempPrice}
                  onChange={(value) => setTempPrice(value.toString())}
                  placeholder="価格を入力"
                  min={0}
                  width="100px"
                  style={{
                    padding: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
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
                onClick={cancelPriceEdit}
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
              <NumericInput
                value={tempQuantity}
                onChange={(value) => setTempQuantity(value.toString())}
                placeholder="個数を入力"
                min={1}
                width="80px"
                style={{
                  padding: '5px',
                  fontSize: '16px'
                }}
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
                onClick={cancelQuantityEdit}
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