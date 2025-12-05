import React from 'react'

interface OrderTotalProps {
  subtotal: number
  tax: number
  total: number
  roundingAdjustment: number
  serviceFeeRate: number  // サービス料率（小数: 0.15, 0.20など）
}

export const OrderTotal: React.FC<OrderTotalProps> = ({
  subtotal,
  tax,
  total,
  roundingAdjustment,
  serviceFeeRate
}) => {
  // パーセント表示用に変換（0.20 → 20）
  const serviceFeePercent = Math.round(serviceFeeRate * 100)

  return (
    <div className="order-total">
      <div className="total-row">
        <span>小計</span>
        <span>¥{subtotal.toLocaleString()}</span>
      </div>
      <div className="total-row">
        <span>サービスtax　{serviceFeePercent}%　+</span>
        <span>¥{tax.toLocaleString()}</span>
      </div>
      
      {/* 端数調整がある場合のみ表示 */}
      {roundingAdjustment !== 0 && (
        <>
          <div className="total-divider"></div>
          <div className="total-row">
            <span>端数調整</span>
            <span style={{ color: roundingAdjustment < 0 ? '#d32f2f' : '#388e3c' }}>
              {roundingAdjustment < 0 ? '' : '+'}¥{roundingAdjustment.toLocaleString()}
            </span>
          </div>
        </>
      )}
      
      <div className="total-divider"></div>
      <div className="total-row final">
        <span>合計金額</span>
        <span className="final-amount">¥{total.toLocaleString()}</span>
      </div>
    </div>
  )
}