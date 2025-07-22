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
  // 追加したpropsを受け取る
  subtotal,
  serviceTax,
  roundedTotal,
  roundingAdjustment
}) => {
  const [selectedOrderItem, setSelectedOrderItem] = useState<number | null>(null)

  return (
    <div className="right-section">
      {/* 変更: order-titleを削除して、新しいヘッダーに置き換え */}
      {/* <div className="order-title">お会計</div> ← この行を削除 */}
      
      {/* 新しいヘッダー: 顧客情報 */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        marginBottom: '10px'
      }}>
        {/* お客様の行 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <span style={{ 
            minWidth: '80px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>お客様：</span>
          <input
            type="text"
            value={formData.guestName}
            onChange={(e) => onUpdateFormData({ guestName: e.target.value })}
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
        
        {/* 推しと来店種別の行 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* 推し */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            flex: 1
          }}>
            <span style={{ 
              minWidth: '80px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>推し：</span>
            <select 
              value={formData.castName}
              onChange={(e) => onUpdateFormData({ castName: e.target.value })}
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
          
          {/* 来店種別 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            flex: 1
          }}>
            <span style={{ 
              minWidth: '80px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>来店種別：</span>
            <select
              value={formData.visitType}
              onChange={(e) => onUpdateFormData({ visitType: e.target.value })}
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
              <option value="初回">初回</option>
              <option value="再訪">再訪</option>
              <option value="常連">常連</option>
            </select>
          </div>
        </div>
      </div>
      {/* ここまでが新しいヘッダー */}

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