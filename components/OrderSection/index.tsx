import React, { useState } from 'react'
import { OrderTable } from './OrderTable'
import { OrderTotal } from './OrderTotal'
import { ItemDetailModal } from './ItemDetailModal'
import { CustomerInfoForm } from './CustomerInfoForm'
import { OrderItem } from '../../types'

interface OrderSectionProps {
  orderItems: OrderItem[]
  onCheckout: () => void
  onClearTable: () => void
  onUpdateOrderItem: (index: number, newQuantity: number) => void
  onDeleteOrderItem: (index: number) => void
  onUpdateOrderItemPrice?: (index: number, newPrice: number) => void
  /* 変更: castName, guestName, onUpdateCast, onUpdateGuestを削除して、formDataとonUpdateFormDataを追加 */
  formData: {
    guestName: string
    castName: string
    visitType: string
    editYear: number
    editMonth: number
    editDate: number
    editHour: number
    editMinute: number
  }
  onUpdateFormData: (updates: Partial<{
    guestName: string
    castName: string
    visitType: string
  }>) => void
  /* ここまで変更 */
  castList?: string[]
  attendingCasts?: string[]
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
  /* 変更: castName, guestNameを削除して、formDataとonUpdateFormDataを使用 */
  formData,
  onUpdateFormData,
  /* ここまで変更 */
  castList = [],
  attendingCasts = [],
  // 追加したpropsを受け取る
  subtotal,
  serviceTax,
  roundedTotal,
  roundingAdjustment
}) => {
  const [selectedOrderItem, setSelectedOrderItem] = useState<number | null>(null)

  return (
    <div className="right-section">
      <CustomerInfoForm
        guestName={formData.guestName}
        castName={formData.castName}
        visitType={formData.visitType}
        castList={castList}
        attendingCasts={attendingCasts}
        onUpdateFormData={onUpdateFormData}
      />

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