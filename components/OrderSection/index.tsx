import React, { useState } from 'react'
import { OrderTable } from './OrderTable'
import { OrderTotal } from './OrderTotal'
import { ItemDetailModal } from './ItemDetailModal'
import { OrderItem } from '../../types'

interface OrderSectionProps {
  orderItems: OrderItem[]
  onCheckout: () => void
  onClearTable: () => void
  onUpdateOrderItem: (index: number, newQuantity: number) => void
  onDeleteOrderItem: (index: number) => void
  onUpdateOrderItemPrice?: (index: number, newPrice: number) => void
  castName?: string
  guestName?: string
  onUpdateCast?: (value: string) => void
  onUpdateGuest?: (value: string) => void
  castList?: string[]
}

export const OrderSection: React.FC<OrderSectionProps> = ({
  orderItems,
  onCheckout,
  onClearTable,
  onUpdateOrderItem,
  onDeleteOrderItem,
  onUpdateOrderItemPrice,
  castName = '',
  guestName = '',
  onUpdateCast,
  onUpdateGuest,
  castList = []
}) => {
  const [selectedOrderItem, setSelectedOrderItem] = useState<number | null>(null)

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = Math.floor(subtotal * 0.15)
    return { subtotal, tax, total: subtotal + tax }
  }

  const { subtotal, tax, total } = calculateTotal()

  return (
    <div className="right-section">
      <div className="order-title">お会計</div>
      
      {/* 推しとお客様名をここに移動 - 修正版 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',  // 垂直方向の中央揃えを追加
        padding: '10px 15px',
        gap: '20px',
        borderBottom: '1px solid #ddd',
        marginBottom: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1,
          height: '32px'  // 高さを統一
        }}>
          <span style={{ 
            whiteSpace: 'nowrap', 
            marginRight: '10px',
            minWidth: '60px'  // 最小幅を設定
          }}>推し：</span>
          <select 
            value={castName}
            onChange={(e) => onUpdateCast && onUpdateCast(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              height: '28px'  // 高さを統一
            }}
          >
            <option value="">-- 選択 --</option>
            {castList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1,
          height: '32px'  // 高さを統一
        }}>
          <span style={{ 
            whiteSpace: 'nowrap', 
            marginRight: '10px',
            minWidth: '60px'  // 最小幅を設定
          }}>お客様：</span>  {/* 修正：名を削除 */}
          <input
            type="text"
            value={guestName}
            onChange={(e) => onUpdateGuest && onUpdateGuest(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              height: '28px'  // 高さを統一
            }}
          />
        </div>
      </div>
      
      <OrderTable
        orderItems={orderItems}
        onItemClick={setSelectedOrderItem}
        onItemDelete={onDeleteOrderItem}
      />
      
      <OrderTotal
        subtotal={subtotal}
        tax={tax}
        total={total}
      />
      
      <div className="action-buttons">
        <button onClick={onCheckout} className="btn-checkout">会計完了</button>
        <button onClick={onClearTable} className="btn-delete">削除</button>
      </div>

      {/* 商品詳細モーダル */}
      {selectedOrderItem !== null && orderItems[selectedOrderItem] && (
        <ItemDetailModal
          item={orderItems[selectedOrderItem]}
          index={selectedOrderItem}
          onClose={() => setSelectedOrderItem(null)}
          onUpdateQuantity={onUpdateOrderItem}
          onDelete={onDeleteOrderItem}
          onUpdatePrice={onUpdateOrderItemPrice}
        />
      )}
    </div>
  )
}