import { Receipt } from '../../types/receipt'

interface ReceiptListProps {
  receipts: Receipt[]
  selectedReceipt: Receipt | null
  loading: boolean
  onSelectReceipt: (receipt: Receipt) => void
}

export default function ReceiptList({ 
  receipts, 
  selectedReceipt, 
  loading, 
  onSelectReceipt 
}: ReceiptListProps) {
  
  // 時刻フォーマット
  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 金額フォーマット
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '10px'
    }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          読み込み中...
        </div>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          伝票がありません
        </div>
      ) : (
        receipts.map((receipt) => (
          <div
            key={receipt.id}
            onClick={() => onSelectReceipt(receipt)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: selectedReceipt?.id === receipt.id ? '#fff3e0' : '#fff',
              border: selectedReceipt?.id === receipt.id ? '2px solid #ff9800' : '1px solid #e8e8e8',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'all 0.2s',
              boxShadow: selectedReceipt?.id === receipt.id ? '0 4px 12px rgba(255, 152, 0, 0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
              transform: selectedReceipt?.id === receipt.id ? 'scale(1.02)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (selectedReceipt?.id !== receipt.id) {
                e.currentTarget.style.backgroundColor = '#fafafa'
                e.currentTarget.style.transform = 'scale(1.01)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedReceipt?.id !== receipt.id) {
                e.currentTarget.style.backgroundColor = '#fff'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '6px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {formatTime(receipt.checkout_datetime)} {receipt.table_number}
              {receipt.deleted_at && (
                <span style={{
                  backgroundColor: '#f44336',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  削除済み
                </span>
              )}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#888', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                padding: '2px 8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                👤 {receipt.staff_name || '-'}
              </span>
              <span>{receipt.guest_name || '-'}様</span>
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#333',
              letterSpacing: '0.5px'
            }}>
              {formatCurrency(receipt.total_incl_tax)}
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              flexWrap: 'wrap'
            }}>
              {(receipt.cash_amount ?? 0) > 0 && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  現金 {formatCurrency(receipt.cash_amount ?? 0)}
                </span>
              )}
              {(receipt.credit_card_amount ?? 0) > 0 && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  カード {formatCurrency(receipt.credit_card_amount ?? 0)}
                </span>
              )}
              {(receipt.other_payment_amount ?? 0) > 0 && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#fff3e0',
                  color: '#e65100',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  その他 {formatCurrency(receipt.other_payment_amount ?? 0)}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}