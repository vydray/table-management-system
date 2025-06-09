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
  // 追加
  subtotal: number
  serviceTax: number
  roundedTotal: number
  roundingAdjustment: number
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
  castList = [],
  // 追加したpropsを受け取る
  subtotal,
  serviceTax,
  roundedTotal,
  roundingAdjustment
}) => {
  const [selectedOrderItem, setSelectedOrderItem] = useState<number | null>(null)

  return (
    <div className="right-section">
      <div className="order-title">お会計</div>

      {/* 推しとお客様を縦並びに変更 */}
      <div style={{
        padding: '10px 15px',
        borderBottom: '1px solid #ddd',
        marginBottom: '10px',
        flexShrink: 0,
        backgroundColor: '#f9f9f9'
      }}>
        {/* 推し */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <span style={{ 
            minWidth: '80px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>推し：</span>
          <select 
            value={castName}
            onChange={(e) => onUpdateCast && onUpdateCast(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">-- 選択 --</option>
            {castList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        
        {/* お客様 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <span style={{ 
            minWidth: '80px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>お客様：</span>
          <input
            type="text"
            value={guestName}
            onChange={(e) => onUpdateGuest && onUpdateGuest(e.target.value)}
            placeholder="お客様名を入力"
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
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
        tax={serviceTax}
        total={roundedTotal}
        roundingAdjustment={roundingAdjustment}
      />

      <div className="action-buttons">
        <button onClick={onCheckout} className="btn-checkout">会計</button>
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