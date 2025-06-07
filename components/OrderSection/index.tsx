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
  castName?: string  // 追加
  guestName?: string  // 追加
  onUpdateCast?: (value: string) => void  // 追加
  onUpdateGuest?: (value: string) => void  // 追加
  castList?: string[]  // 追加
}

export const OrderSection: React.FC<OrderSectionProps> = ({
  orderItems,
  onCheckout,
  onClearTable,
  onUpdateOrderItem,
  onDeleteOrderItem,
  onUpdateOrderItemPrice,
  castName = '',  // 追加
  guestName = '',  // 追加
  onUpdateCast,  // 追加
  onUpdateGuest,  // 追加
  castList = []  // 追加
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
      
      {/* 推しとお客様名をここに移動 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 15px',
        gap: '20px',
        borderBottom: '1px solid #ddd',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <span style={{ whiteSpace: 'nowrap', marginRight: '10px' }}>推し：</span>
          <select 
            value={castName}
            onChange={(e) => onUpdateCast && onUpdateCast(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">-- 選択 --</option>
            {castList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <span style={{ whiteSpace: 'nowrap', marginRight: '10px' }}>お客様名：</span>
          <input
            type="text"
            value={guestName}
            onChange={(e) => onUpdateGuest && onUpdateGuest(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
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