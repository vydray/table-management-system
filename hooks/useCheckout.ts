import { getCurrentStoreId } from '../utils/storeContext'
import { getJapanTimeString } from '../utils/dateTime'

interface OrderItem {
  name: string
  price: number
  quantity: number
  cast?: string
}

interface FormData {
  guestName: string
  castName: string[]
  visitType: string
}

interface PaymentData {
  cash: number
  card: number
  other: number
  otherMethod: string
  cardFee?: number
  discount?: number
}

interface CheckoutResult {
  receiptNumber?: string
  orderId?: number
  status?: string
  message?: string
  data?: Record<string, any>
}

export const useCheckout = () => {
  // 会計処理を実行
  const executeCheckout = async (
    currentTable: string,
    orderItems: OrderItem[],
    formData: FormData,
    paymentData: PaymentData,
    totalAmount: number
  ): Promise<CheckoutResult | null> => {
    try {
      const checkoutTime = getJapanTimeString(new Date())
      const storeId = getCurrentStoreId()

      const response = await fetch('/api/tables/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable,
          checkoutTime,
          orderItems: orderItems,
          guestName: formData.guestName,
          castName: formData.castName,
          visitType: formData.visitType,
          paymentCash: paymentData.cash,
          paymentCard: paymentData.card,
          paymentOther: paymentData.other,
          paymentOtherMethod: paymentData.otherMethod,
          cardFee: paymentData.cardFee || 0,
          discountAmount: paymentData.discount || 0,
          totalAmount: totalAmount,
          storeId: storeId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed')
      }

      return result
    } catch (error) {
      console.error('Error checkout:', error)
      throw error
    }
  }

  return {
    executeCheckout
  }
}
