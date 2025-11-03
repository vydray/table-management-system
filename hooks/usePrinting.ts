import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'
import { printer } from '../utils/bluetoothPrinter'
import { calculateSubtotal, calculateServiceTax } from '../utils/calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface OrderItem {
  name: string
  price: number
  quantity: number
  cast?: string
}

interface SystemSettings {
  consumptionTaxRate: number
  serviceChargeRate: number
  roundingUnit: number
  roundingMethod: number
  cardFeeRate: number
}

interface FormData {
  guestName: string
  castName: string
  visitType: string
  editYear: number
  editMonth: number
  editDate: number
  editHour: number
  editMinute: number
}

interface PaymentData {
  cash: number
  card: number
  other: number
  otherMethod: string
}

interface Tables {
  [key: string]: {
    elapsed?: string
  }
}

interface CheckoutResult {
  receiptNumber?: string
}

export const usePrinting = () => {
  const router = useRouter()

  // 会計伝票を印刷
  const printOrderSlip = async (
    currentTable: string,
    formData: FormData,
    tables: Tables,
    orderItems: OrderItem[],
    systemSettings: SystemSettings,
    getRoundedTotalAmount: () => number,
    getRoundingAdjustmentAmount: () => number
  ) => {
    try {
      const isConnected = await printer.checkConnection()
      if (!isConnected) {
        if (confirm('プリンターが接続されていません。設定画面で接続しますか？')) {
          router.push('/settings?tab=receipt')
        }
        return
      }

      const now = new Date()
      const timestamp = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const orderData = {
        tableName: currentTable,
        guestName: formData.guestName || '（未入力）',
        castName: formData.castName || '（未選択）',
        elapsedTime: tables[currentTable]?.elapsed || '0分',
        orderItems: orderItems,
        subtotal: calculateSubtotal(orderItems),
        serviceTax: calculateServiceTax(calculateSubtotal(orderItems), systemSettings.serviceChargeRate),
        roundedTotal: getRoundedTotalAmount(),
        roundingAdjustment: getRoundingAdjustmentAmount(),
        timestamp: timestamp
      }

      await printer.printOrderSlip(orderData)
      alert('会計伝票を印刷しました')
    } catch (error) {
      console.error('Print error:', error)
      if (error instanceof Error) {
        alert('印刷に失敗しました: ' + error.message)
      } else {
        alert('印刷に失敗しました: Unknown error')
      }
    }
  }

  // 領収書を印刷
  const printReceipt = async (
    currentTable: string,
    formData: FormData,
    orderItems: OrderItem[],
    systemSettings: SystemSettings,
    paymentData: PaymentData,
    checkoutResult: CheckoutResult | null,
    getRoundedTotalAmount: () => number,
    getRoundingAdjustmentAmount: () => number
  ) => {
    try {
      const storeId = getCurrentStoreId()

      const receiptTo = prompt('宛名を入力してください（空欄可）:', formData.guestName || '') || ''

      if (receiptTo === null) {
        return false
      }

      const { data: receiptSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('store_id', storeId)
        .single()

      let defaultReceiptNote = 'お品代として'
      if (receiptSettings?.receipt_templates && Array.isArray(receiptSettings.receipt_templates)) {
        const defaultTemplate = receiptSettings.receipt_templates.find((t: { is_default: boolean }) => t.is_default)
        if (defaultTemplate) {
          defaultReceiptNote = defaultTemplate.text
        }
      }

      const receiptNote = prompt('但し書きを入力してください:', defaultReceiptNote) || defaultReceiptNote

      await printer.enable()

      const devices = await printer.getPairedDevices()
      const mpb20 = devices.find(device =>
        device.name && device.name.toUpperCase().includes('MP-B20')
      )

      if (mpb20) {
        await printer.connect(mpb20.address)
        await new Promise(resolve => setTimeout(resolve, 500))

        const now = new Date()
        const timestamp = now.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        const subtotal = calculateSubtotal(orderItems)
        const serviceTax = calculateServiceTax(subtotal, systemSettings.serviceChargeRate)
        const consumptionTax = Math.floor((subtotal + serviceTax) * systemSettings.consumptionTaxRate)

        // カード手数料の計算（カード金額のみに適用）
        const cardFee = paymentData.card > 0 && systemSettings.cardFeeRate > 0
          ? Math.floor(paymentData.card * (systemSettings.cardFeeRate / 100))
          : 0

        const roundedTotal = getRoundedTotalAmount()
        const totalWithCardFee = roundedTotal + cardFee

        await printer.printReceipt({
          storeName: receiptSettings?.store_name || '店舗名',
          storeAddress: receiptSettings?.store_address || '',
          storePhone: receiptSettings?.store_phone || '',
          storePostalCode: receiptSettings?.store_postal_code || '',
          storeRegistrationNumber: receiptSettings?.store_registration_number || '',
          receiptNumber: checkoutResult?.receiptNumber || 'R' + Date.now(),
          receiptTo: receiptTo,
          receiptNote: receiptNote,
          showRevenueStamp: receiptSettings?.show_revenue_stamp ?? true,
          revenueStampThreshold: receiptSettings?.revenue_stamp_threshold || 50000,
          tableName: currentTable,
          guestName: formData.guestName || '（未入力）',
          castName: formData.castName || '（未選択）',
          timestamp: timestamp,
          orderItems: orderItems,
          subtotal: subtotal,
          serviceTax: serviceTax,
          consumptionTax: consumptionTax,
          roundingAdjustment: getRoundingAdjustmentAmount(),
          roundedTotal: roundedTotal,
          cardFeeRate: systemSettings.cardFeeRate,
          cardFee: cardFee,
          paymentCash: paymentData.cash,
          paymentCard: paymentData.card,
          paymentOther: paymentData.other,
          paymentOtherMethod: paymentData.otherMethod,
          change: (paymentData.cash + paymentData.card + paymentData.other) - totalWithCardFee
        })

        await printer.disconnect()
        return true
      } else {
        alert('MP-B20が見つかりません。')
        return false
      }
    } catch (printError) {
      console.error('領収書印刷エラー:', printError)
      const errorMessage = printError instanceof Error
        ? printError.message
        : '不明なエラーが発生しました'
      alert('領収書印刷に失敗しました。\n' + errorMessage)
      return false
    }
  }

  return {
    printOrderSlip,
    printReceipt
  }
}
