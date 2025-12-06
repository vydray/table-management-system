import React, { useState } from 'react'
import { OrderItem } from '../../types'

interface ItemDetailModalProps {
  item: OrderItem
  index: number
  onClose: () => void
  onUpdateQuantity: (index: number, quantity: number) => void
  onDelete: (index: number) => void
  onUpdatePrice?: (index: number, price: number) => void
}

type ActiveField = 'price' | 'quantity' | null

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  index,
  onClose,
  onUpdateQuantity,
  onDelete,
  onUpdatePrice
}) => {
  const [activeField, setActiveField] = useState<ActiveField>(null)
  const [tempPrice, setTempPrice] = useState(item.price)
  const [tempQuantity, setTempQuantity] = useState(item.quantity)

  const handleNumberClick = (num: string) => {
    if (!activeField) return

    if (activeField === 'price') {
      const currentValue = tempPrice
      const newValue = currentValue === 0 ? parseInt(num) : parseInt(currentValue.toString() + num)
      setTempPrice(newValue)
      if (onUpdatePrice) onUpdatePrice(index, newValue)
    } else {
      const currentValue = tempQuantity
      const newValue = currentValue === 0 ? parseInt(num) : parseInt(currentValue.toString() + num)
      if (newValue > 0) {
        setTempQuantity(newValue)
        onUpdateQuantity(index, newValue)
      }
    }
  }

  const handleDeleteNumber = () => {
    if (!activeField) return

    if (activeField === 'price') {
      const currentStr = tempPrice.toString()
      const newValue = currentStr.length > 1 ? parseInt(currentStr.slice(0, -1)) : 0
      setTempPrice(newValue)
      if (onUpdatePrice) onUpdatePrice(index, newValue)
    } else {
      const currentStr = tempQuantity.toString()
      const newValue = currentStr.length > 1 ? parseInt(currentStr.slice(0, -1)) : 1
      setTempQuantity(newValue)
      onUpdateQuantity(index, newValue)
    }
  }

  const handleClearNumber = () => {
    if (!activeField) return

    if (activeField === 'price') {
      setTempPrice(0)
      if (onUpdatePrice) onUpdatePrice(index, 0)
    } else {
      setTempQuantity(1)
      onUpdateQuantity(index, 1)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, tempQuantity + delta)
    setTempQuantity(newQuantity)
    onUpdateQuantity(index, newQuantity)
  }

  const currentValue = activeField === 'price' ? tempPrice : activeField === 'quantity' ? tempQuantity : 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '700px',
          maxWidth: '95%',
          maxHeight: '90vh',
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        {/* 左側：商品情報 */}
        <div style={{
          flex: 1,
          padding: '25px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 商品名 */}
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '22px',
            color: '#333'
          }}>
            {item.name}
          </h3>

          {item.cast && (
            <p style={{
              margin: '0 0 20px 0',
              color: '#666',
              fontSize: '14px'
            }}>
              キャスト: {item.cast}
            </p>
          )}

          {/* 単価入力 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px'
            }}>
              単価
            </label>
            <div
              onClick={() => setActiveField('price')}
              style={{
                padding: '15px',
                border: activeField === 'price' ? '2px solid #ff9800' : '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeField === 'price' ? '#fff8e1' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ color: '#666', fontSize: '18px' }}>¥</span>
              <span>{tempPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* 個数入力 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px'
            }}>
              個数
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={tempQuantity <= 1}
                style={{
                  width: '50px',
                  height: '50px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: tempQuantity <= 1 ? '#e0e0e0' : '#ff9800',
                  color: tempQuantity <= 1 ? '#999' : 'white',
                  cursor: tempQuantity <= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                −
              </button>
              <div
                onClick={() => setActiveField('quantity')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: activeField === 'quantity' ? '2px solid #ff9800' : '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: activeField === 'quantity' ? '#fff8e1' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                {tempQuantity}
              </div>
              <button
                onClick={() => handleQuantityChange(1)}
                style={{
                  width: '50px',
                  height: '50px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* 小計 */}
          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '16px', color: '#666' }}>小計</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                ¥{(tempPrice * tempQuantity).toLocaleString()}
              </span>
            </div>
          </div>

          {/* ボタン */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: 'auto'
          }}>
            <button
              onClick={() => {
                onDelete(index)
                onClose()
              }}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              削除
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#e0e0e0',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              閉じる
            </button>
          </div>
        </div>

        {/* 右側：数字パッド */}
        <div style={{
          width: '280px',
          backgroundColor: '#f5f5f5',
          padding: '25px',
          borderLeft: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 現在の入力値表示 */}
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'right',
            fontSize: '28px',
            fontWeight: 'bold',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            color: activeField ? '#333' : '#ccc'
          }}>
            {activeField === 'price' ? '¥' : ''}{currentValue.toLocaleString()}
          </div>

          {/* 入力先表示 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            fontSize: '14px',
            color: activeField ? '#ff9800' : '#999'
          }}>
            {activeField === 'price' ? '単価を入力中' : activeField === 'quantity' ? '個数を入力中' : '入力欄をタップ'}
          </div>

          {/* 数字パッド */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            flex: 1
          }}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                disabled={!activeField}
                style={{
                  padding: '18px',
                  backgroundColor: activeField ? 'white' : '#e0e0e0',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  cursor: activeField ? 'pointer' : 'not-allowed',
                  color: activeField ? '#333' : '#999'
                }}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => handleNumberClick('0')}
              disabled={!activeField}
              style={{
                padding: '18px',
                backgroundColor: activeField ? 'white' : '#e0e0e0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '22px',
                fontWeight: 'bold',
                cursor: activeField ? 'pointer' : 'not-allowed',
                color: activeField ? '#333' : '#999'
              }}
            >
              0
            </button>

            <button
              onClick={() => handleNumberClick('00')}
              disabled={!activeField}
              style={{
                padding: '18px',
                backgroundColor: activeField ? 'white' : '#e0e0e0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '22px',
                fontWeight: 'bold',
                cursor: activeField ? 'pointer' : 'not-allowed',
                color: activeField ? '#333' : '#999'
              }}
            >
              00
            </button>

            <button
              onClick={handleDeleteNumber}
              disabled={!activeField}
              style={{
                padding: '18px',
                backgroundColor: activeField ? '#ffebee' : '#e0e0e0',
                border: '1px solid #ffcdd2',
                borderRadius: '8px',
                fontSize: '18px',
                cursor: activeField ? 'pointer' : 'not-allowed',
                color: activeField ? '#d32f2f' : '#999'
              }}
            >
              ←
            </button>
          </div>

          {/* クリアボタン */}
          <button
            onClick={handleClearNumber}
            disabled={!activeField}
            style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: activeField ? '#e0e0e0' : '#f0f0f0',
              border: '1px solid #bdbdbd',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: activeField ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              color: activeField ? '#333' : '#999'
            }}
          >
            クリア
          </button>
        </div>
      </div>
    </div>
  )
}
