import { Receipt, OrderItem } from '../../types/receipt'
import { printer } from '../../utils/bluetoothPrinter'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  selectedReceipt: Receipt | null
  orderItems: OrderItem[]
  onDelete: (receiptId: string) => void
}

export default function ReceiptDetail({ selectedReceipt, orderItems, onDelete }: Props) {
  const router = useRouter()

  // 領収書印刷
  const printReceipt = async () => {
    if (!selectedReceipt) return

    try {
      // プリンター接続を確認
      const isConnected = await printer.checkConnection()
      if (!isConnected) {
        if (confirm('プリンターが接続されていません。設定画面で接続しますか？')) {
          router.push('/settings?tab=receipt')
        }
        return
      }

      const storeId = getCurrentStoreId()

      // 店舗設定を取得
      const { data: receiptSettings } = await supabase
        .from('receipt_settings')
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
      if (receiptSettings?.receipt_templates && Array.isArray(receiptSettings.receipt_templates)) {
        const defaultTemplate = receiptSettings.receipt_templates.find((t: { is_default: boolean }) => t.is_default)
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
        storeName: receiptSettings?.store_name || '店舗名',
        storeAddress: receiptSettings?.store_address || '',
        storePhone: receiptSettings?.store_phone || '',
        storePostalCode: receiptSettings?.store_postal_code || '',
        storeRegistrationNumber: receiptSettings?.store_registration_number || '',

        // 領収書情報
        receiptNumber: selectedReceipt.receipt_number,
        receiptTo: receiptTo,
        receiptNote: receiptNote,

        // 収入印紙設定
        showRevenueStamp: receiptSettings?.show_revenue_stamp ?? true,
        revenueStampThreshold: receiptSettings?.revenue_stamp_threshold || 50000,

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

  if (!selectedReceipt) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#999'
      }}>
        伝票を選択してください
      </div>
    )
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)

  // 伝票印刷（ブラウザ印刷）
  const printSlip = async () => {
    if (!selectedReceipt) return

    try {
      // プリンター接続を確認
      const isConnected = await printer.checkConnection()
      if (!isConnected) {
        if (confirm('プリンターが接続されていません。設定画面で接続しますか？')) {
          router.push('/settings?tab=receipt')
        }
        return
      }

      // 印刷データを準備
      const orderData = {
        tableName: selectedReceipt.table_number,
        guestName: selectedReceipt.guest_name || '（未入力）',
        castName: '', // 伝票にはキャスト情報がない場合
        elapsedTime: '',
        orderItems: orderItems.map(item => ({
          name: item.product_name,
          cast: item.cast_name,
          quantity: item.quantity,
          price: item.unit_price
        })),
        subtotal: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
        serviceTax: 0, // 計算が必要な場合は追加
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

  return (
    <>

      <div style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column' 
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ margin: 0, marginBottom: '10px', fontSize: '18px' }}>
            {selectedReceipt.deleted_at && (
              <span style={{ 
                color: '#f44336',
                marginRight: '10px' 
              }}>
                【削除済】
              </span>
            )}
            伝票番号: {selectedReceipt.receipt_number}
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div>会計時刻: {new Date(selectedReceipt.checkout_datetime).toLocaleString('ja-JP')}</div>
            <div>卓番号: {selectedReceipt.table_number}</div>
            <div>お客様: {selectedReceipt.guest_name || '（未入力）'}</div>
            <div>担当: {selectedReceipt.staff_name || '（未入力）'}</div>
          </div>
        </div>

        <div className="receipt-content" style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h4 style={{ 
            margin: '0 0 15px 0',
            fontSize: '16px',
            paddingBottom: '10px',
            borderBottom: '2px solid #333'
          }}>
            注文明細
          </h4>

          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>商品名</th>
                <th style={{ textAlign: 'center', padding: '8px', width: '60px' }}>数量</th>
                <th style={{ textAlign: 'right', padding: '8px', width: '80px' }}>単価</th>
                <th style={{ textAlign: 'right', padding: '8px', width: '80px' }}>小計</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    {item.product_name}
                    {item.cast_name && (
                      <span style={{ 
                        display: 'block',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        （{item.cast_name}）
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>¥{item.unit_price.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>¥{item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #333' }}>
                <td colSpan={3} style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                  小計:
                </td>
                <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                  ¥{subtotal.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', padding: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                  合計金額:
                </td>
                <td style={{ textAlign: 'right', padding: '8px', fontSize: '18px', fontWeight: 'bold', color: '#FF5722' }}>
                  ¥{selectedReceipt.total_incl_tax.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="no-print" style={{
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {!selectedReceipt.deleted_at && (
            <>
              <button
                onClick={printSlip}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976D2'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2196F3'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.2)'
                }}
              >
                🖨️ 伝票印刷
              </button>
              <button
                onClick={printReceipt}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#388E3C'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4CAF50'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.2)'
                }}
              >
                🧾 領収書印刷
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(selectedReceipt.id)}
            style={{
              padding: '12px 32px',
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(244, 67, 54, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d32f2f'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f44336'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.2)'
            }}
          >
            🗑️ 削除
          </button>
        </div>
      </div>
    </>
  )
}