import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'
import { printer } from '../utils/bluetoothPrinter'
import { Receipt, OrderItem } from '../types/receipt'

export const useReceiptPrint = () => {
  // 領収書印刷
  const printReceipt = async (
    selectedReceipt: Receipt,
    orderItems: OrderItem[],
    onPrinterSettingsNavigate: () => void
  ) => {
    try {
      // プリンター接続を確認
      const isConnected = await printer.checkConnection()
      if (!isConnected) {
        if (confirm('プリンターが接続されていません。設定画面で接続しますか？')) {
          onPrinterSettingsNavigate()
        }
        return
      }

      const storeId = getCurrentStoreId()

      // 店舗設定を取得
      const { data: storeSettings } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .single()

      // システム設定を取得
      const { data: systemSettings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('store_id', storeId)

      const settings = {
        serviceChargeRate: 0.1,
        consumptionTaxRate: 0.1
      }

      if (systemSettings) {
        systemSettings.forEach(s => {
          if (s.setting_key === 'service_charge_rate') {
            settings.serviceChargeRate = parseFloat(s.setting_value)
          } else if (s.setting_key === 'consumption_tax_rate') {
            settings.consumptionTaxRate = parseFloat(s.setting_value)
          }
        })
      }

      // 支払い情報を取得
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', selectedReceipt.id)
        .single()

      // 宛名を入力
      const receiptTo = prompt('宛名を入力してください（空欄可）:', '') || ''

      // デフォルトの但し書きを取得
      let defaultReceiptNote = 'お品代として'
      if (storeSettings?.receipt_templates && Array.isArray(storeSettings.receipt_templates)) {
        const defaultTemplate = storeSettings.receipt_templates.find((t: { is_default: boolean }) => t.is_default)
        if (defaultTemplate) {
          defaultReceiptNote = defaultTemplate.text
        }
      }

      const receiptNote = prompt('但し書きを入力してください:', defaultReceiptNote) || defaultReceiptNote

      // 小計を計算
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
      const serviceTax = Math.floor(subtotal * settings.serviceChargeRate)
      const consumptionTax = Math.floor((subtotal + serviceTax) * settings.consumptionTaxRate)

      // 領収書印刷データを準備
      const receiptData = {
        // 店舗情報
        storeName: storeSettings?.store_name || '店舗名',
        storeAddress: storeSettings?.store_address || '',
        storePhone: storeSettings?.store_phone || '',
        storePostalCode: storeSettings?.store_postal_code || '',
        storeRegistrationNumber: storeSettings?.store_registration_number || '',

        // 領収書情報
        receiptNumber: selectedReceipt.receipt_number,
        receiptTo: receiptTo,
        receiptNote: receiptNote,

        // 収入印紙設定
        showRevenueStamp: storeSettings?.show_revenue_stamp ?? true,
        revenueStampThreshold: storeSettings?.revenue_stamp_threshold || 50000,

        // 基本情報
        tableName: selectedReceipt.table_number,
        guestName: selectedReceipt.guest_name || '（未入力）',
        castName: '',
        timestamp: new Date(selectedReceipt.checkout_datetime).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),

        // 注文明細
        orderItems: orderItems.map(item => ({
          name: item.product_name,
          cast: item.cast_name,
          quantity: item.quantity,
          price: item.unit_price
        })),

        // 金額情報
        subtotal: subtotal,
        serviceTax: serviceTax,
        consumptionTax: consumptionTax,
        roundingAdjustment: 0,
        roundedTotal: selectedReceipt.total_incl_tax,

        // 支払い情報
        paymentCash: paymentData?.cash_amount || 0,
        paymentCard: paymentData?.credit_card_amount || 0,
        paymentOther: paymentData?.other_payment_amount || 0,
        paymentOtherMethod: paymentData?.other_payment_method || '',
        change: paymentData?.change_amount || 0
      }

      // 印刷実行
      await printer.printReceipt(receiptData)
      alert('領収書を印刷しました')
    } catch (error) {
      console.error('Print error:', error)
      if (error instanceof Error) {
        alert('印刷に失敗しました: ' + error.message)
      } else {
        alert('印刷に失敗しました')
      }
    }
  }

  // 伝票印刷
  const printSlip = async (
    selectedReceipt: Receipt,
    orderItems: OrderItem[],
    onPrinterSettingsNavigate: () => void
  ) => {
    try {
      // プリンター接続を確認
      const isConnected = await printer.checkConnection()
      if (!isConnected) {
        if (confirm('プリンターが接続されていません。設定画面で接続しますか？')) {
          onPrinterSettingsNavigate()
        }
        return
      }

      // 印刷データを準備
      const orderData = {
        tableName: selectedReceipt.table_number,
        guestName: selectedReceipt.guest_name || '（未入力）',
        castName: '',
        elapsedTime: '',
        orderItems: orderItems.map(item => ({
          name: item.product_name,
          cast: item.cast_name,
          quantity: item.quantity,
          price: item.unit_price
        })),
        subtotal: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
        serviceTax: 0,
        roundedTotal: selectedReceipt.total_incl_tax,
        roundingAdjustment: 0,
        timestamp: new Date(selectedReceipt.checkout_datetime).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      }

      // 印刷実行
      await printer.printOrderSlip(orderData)
      alert('会計伝票を印刷しました')
    } catch (error) {
      console.error('Print error:', error)
      if (error instanceof Error) {
        alert('印刷に失敗しました: ' + error.message)
      } else {
        alert('印刷に失敗しました')
      }
    }
  }

  return {
    printReceipt,
    printSlip
  }
}
