import React from 'react'

interface OrderTotalProps {
  subtotal: number
  tax: number
  total: number
}

export const OrderTotal: React.FC<OrderTotalProps> = ({ 
  subtotal, 
  tax, 
  total 
}) => {
  return (
    <div className="order-total">
      <div className="total-row">
        <span>小計</span>
        <span>¥{subtotal.toLocaleString()}</span>
      </div>
      <div className="total-row">
        <span>サービスtax　15%　+</span>
        <span>¥{tax.toLocaleString()}</span>
      </div>
      <div className="total-divider"></div>
      <div className="total-row final">
        <span>合計金額</span>
        <span className="final-amount">¥{total.toLocaleString()}</span>
      </div>
    </div>
  )
}