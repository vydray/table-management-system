// 伝票の型定義
export interface Receipt {
  id: string
  receipt_number: string
  checkout_datetime: string
  table_number: string
  total_incl_tax: number
  guest_name: string
  staff_name: string
}

// 注文明細の型定義
export interface OrderItem {
  id: string
  order_id: string
  category: string
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
  cast_name?: string
}