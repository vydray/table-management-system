import { OrderItem } from '../types'

/**
 * 注文アイテムの小計を計算
 */
export const calculateSubtotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

/**
 * サービス料を計算
 */
export const calculateServiceTax = (subtotal: number, rate: number): number => {
  return Math.floor(subtotal * rate)
}

/**
 * 消費税を計算
 */
export const calculateConsumptionTax = (amount: number, rate: number): number => {
  return Math.floor(amount * rate)
}

/**
 * 端数処理を適用した合計金額を計算
 * @param amount 元の金額
 * @param roundingUnit 端数処理の単位（例: 100円単位）
 * @param roundingMethod 0: 切り上げ, 1: 切り捨て, 2: 四捨五入
 */
export const getRoundedTotal = (
  amount: number,
  roundingUnit: number,
  roundingMethod: number
): number => {
  if (roundingUnit <= 0) return amount

  switch (roundingMethod) {
    case 0: // 切り上げ
      return Math.ceil(amount / roundingUnit) * roundingUnit
    case 1: // 切り捨て
      return Math.floor(amount / roundingUnit) * roundingUnit
    case 2: // 四捨五入
      return Math.round(amount / roundingUnit) * roundingUnit
    default:
      return amount
  }
}

/**
 * 端数調整額を計算
 */
export const getRoundingAdjustment = (
  originalTotal: number,
  roundedTotal: number
): number => {
  return roundedTotal - originalTotal
}
