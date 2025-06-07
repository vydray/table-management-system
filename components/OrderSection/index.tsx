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
}

export const OrderSection: React.FC<OrderSectionProps> = ({
  orderItems,
  onCheckout,
  onClearTable,
  onUpdateOrderItem,
  onDeleteOrderItem
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

      {/* 商品詳細モーダル - 修正版 */}
      {selectedOrderItem !== null && orderItems[selectedOrderItem] && (
        <ItemDetailModal
          item={orderItems[selectedOrderItem]}
          index={selectedOrderItem}
          onClose={() => setSelectedOrderItem(null)}
          onUpdateQuantity={onUpdateOrderItem}
          onDelete={onDeleteOrderItem}
        />
      )}
    </div>
  )
}