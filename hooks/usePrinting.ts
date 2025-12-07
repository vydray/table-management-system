import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'
import { printer } from '../utils/bluetoothPrinter'
import { calculateSubtotal, calculateServiceTax } from '../utils/calculations'

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
    systemSettings: SystemSettings, // eslint-disable-line @typescript-eslint/no-unused-vars
    paymentData: PaymentData,
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

      // 印刷時にデータベースから最新の設定を取得
      const storeId = getCurrentStoreId()
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('store_id', storeId)

      const latestSettings = {
        consumptionTaxRate: settings?.find(s => s.setting_key === 'consumption_tax_rate')?.setting_value || 0.10,
        serviceChargeRate: settings?.find(s => s.setting_key === 'service_charge_rate')?.setting_value || 0.15,
        roundingUnit: settings?.find(s => s.setting_key === 'rounding_unit')?.setting_value || 100,
        roundingMethod: settings?.find(s => s.setting_key === 'rounding_method')?.setting_value || 0,
        cardFeeRate: Number(settings?.find(s => s.setting_key === 'card_fee_rate')?.setting_value || 0) / 100
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

      // カード手数料の計算（PaymentModalと同じロジック：残りの金額に対して適用）
      const roundedTotal = getRoundedTotalAmount()
      const remainingAmount = roundedTotal - paymentData.cash - paymentData.other
      const cardFee = paymentData.card > 0 && latestSettings.cardFeeRate > 0 && remainingAmount > 0
        ? Math.floor(remainingAmount * (latestSettings.cardFeeRate / 100))
        : 0

      const orderData = {
        tableName: currentTable,
        guestName: formData.guestName || '（未入力）',
        castName: formData.castName || '（未選択）',
        elapsedTime: tables[currentTable]?.elapsed || '0分',
        orderItems: orderItems,
        subtotal: calculateSubtotal(orderItems),
        serviceTax: calculateServiceTax(calculateSubtotal(orderItems), latestSettings.serviceChargeRate),
        roundedTotal: getRoundedTotalAmount(),
        roundingAdjustment: getRoundingAdjustmentAmount(),
        cardFeeRate: Math.round(latestSettings.cardFeeRate * 100), // 整数に変換（0.1 → 10）
        cardFee: cardFee,
        roundingUnit: latestSettings.roundingUnit,
        roundingMethod: latestSettings.roundingMethod,
        paymentCash: paymentData.cash,
        paymentCard: paymentData.card,
        paymentOther: paymentData.other,
        paymentOtherMethod: paymentData.otherMethod,
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
    systemSettings: SystemSettings, // eslint-disable-line @typescript-eslint/no-unused-vars
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

      // 印刷時にデータベースから最新の設定を取得
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('store_id', storeId)

      const latestSettings = {
        consumptionTaxRate: settings?.find(s => s.setting_key === 'consumption_tax_rate')?.setting_value || 0.10,
        serviceChargeRate: settings?.find(s => s.setting_key === 'service_charge_rate')?.setting_value || 0.15,
        roundingUnit: settings?.find(s => s.setting_key === 'rounding_unit')?.setting_value || 100,
        roundingMethod: settings?.find(s => s.setting_key === 'rounding_method')?.setting_value || 0,
        cardFeeRate: Number(settings?.find(s => s.setting_key === 'card_fee_rate')?.setting_value || 0) / 100
      }

      const { data: storeSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('store_id', storeId)
        .single()

      let defaultReceiptNote = 'お品代として'
      if (storeSettings?.receipt_templates && Array.isArray(storeSettings.receipt_templates)) {
        const defaultTemplate = storeSettings.receipt_templates.find((t: { is_default: boolean }) => t.is_default)
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
        const serviceTax = calculateServiceTax(subtotal, latestSettings.serviceChargeRate)
        const consumptionTax = Math.floor((subtotal + serviceTax) * latestSettings.consumptionTaxRate)

        const roundedTotal = getRoundedTotalAmount()

        // カード手数料の計算（PaymentModalと同じロジック：残りの金額に対して適用）
        const remainingAmount = roundedTotal - paymentData.cash - paymentData.other
        const cardFee = paymentData.card > 0 && latestSettings.cardFeeRate > 0 && remainingAmount > 0
          ? Math.floor(remainingAmount * (latestSettings.cardFeeRate / 100))
          : 0

        const totalWithCardFee = roundedTotal + cardFee

        await printer.printReceipt({
          storeName: storeSettings?.store_name || '店舗名',
          storeAddress: storeSettings?.store_address || '',
          storePhone: storeSettings?.store_phone || '',
          storePostalCode: storeSettings?.store_postal_code || '',
          storeRegistrationNumber: storeSettings?.store_registration_number || '',
          receiptNumber: checkoutResult?.receiptNumber || 'R' + Date.now(),
          receiptTo: receiptTo,
          receiptNote: receiptNote,
          showRevenueStamp: storeSettings?.show_revenue_stamp ?? true,
          revenueStampThreshold: storeSettings?.revenue_stamp_threshold || 50000,
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
          cardFeeRate: Math.round(latestSettings.cardFeeRate * 100), // 整数に変換（0.1 → 10）
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
