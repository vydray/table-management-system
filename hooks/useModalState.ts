import { useState } from 'react'

// チェックアウト結果の型定義
interface CheckoutResult {
  receiptNumber?: string
  orderId?: number
  status?: string
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>
}

export const useModalState = () => {
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [showReceiptConfirm, setShowReceiptConfirm] = useState(false)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)

  return {
    showModal,
    setShowModal,
    modalMode,
    setModalMode,
    showPaymentModal,
    setShowPaymentModal,
    isProcessingCheckout,
    setIsProcessingCheckout,
    showReceiptConfirm,
    setShowReceiptConfirm,
    checkoutResult,
    setCheckoutResult
  }
}
