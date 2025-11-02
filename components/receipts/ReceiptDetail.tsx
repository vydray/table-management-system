import { Receipt, OrderItem } from '../../types/receipt'
import { useRouter } from 'next/router'
import { useReceiptPrint } from '../../hooks/useReceiptPrint'

interface Props {
  selectedReceipt: Receipt | null
  orderItems: OrderItem[]
  onDelete: (receiptId: string) => void
}

export default function ReceiptDetail({ selectedReceipt, orderItems, onDelete }: Props) {
  const router = useRouter()
  const { printReceipt: printReceiptFromHook, printSlip: printSlipFromHook } = useReceiptPrint()

  // 設定画面へのナビゲーション
  const navigateToPrinterSettings = () => {
    router.push('/settings?tab=receipt')
  }

  // 領収書印刷のラッパー
  const handlePrintReceipt = async () => {
    if (!selectedReceipt) return
    await printReceiptFromHook(selectedReceipt, orderItems, navigateToPrinterSettings)
  }

  // 伝票印刷のラッパー
  const handlePrintSlip = async () => {
    if (!selectedReceipt) return
    await printSlipFromHook(selectedReceipt, orderItems, navigateToPrinterSettings)
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
                onClick={handlePrintSlip}
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
                onClick={handlePrintReceipt}
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