import { Receipt, OrderItem } from '../../types/receipt'

interface ReceiptDetailProps {
  selectedReceipt: Receipt | null
  orderItems: OrderItem[]
  onDelete: (receiptId: string) => void
}

export default function ReceiptDetail({ 
  selectedReceipt, 
  orderItems, 
  onDelete 
}: ReceiptDetailProps) {
  
  // 金額フォーマット
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  if (!selectedReceipt) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '18px'
      }}>
        伝票を選択してください
      </div>
    )
  }

  return (
    <>
      {/* 詳細ヘッダー */}
      <div style={{
        padding: '30px',
        borderBottom: '1px solid #e0e0e0',
        background: 'linear-gradient(to bottom, #ffffff, #fafafa)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '28px',
            fontWeight: '600',
            color: '#333'
          }}>
            伝票詳細
          </h2>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#666',
            fontWeight: '500'
          }}>
            {selectedReceipt.receipt_number}
          </div>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8f8f8',
            borderRadius: '10px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#999',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Table & Time
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
              {selectedReceipt.table_number}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {new Date(selectedReceipt.checkout_datetime).toLocaleString('ja-JP')}
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#f8f8f8',
            borderRadius: '10px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#999',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Customer Info
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
              <span style={{ color: '#ff9800' }}>👤</span> {selectedReceipt.staff_name || '-'}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {selectedReceipt.guest_name || '-'} 様
            </div>
          </div>
        </div>
      </div>

      {/* 明細テーブルと合計をまとめてスクロール */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {/* 明細テーブル */}
        <div style={{
          padding: '20px 30px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  商品名
                </th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  数量
                </th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  単価
                </th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  小計
                </th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => (
                <tr key={item.id} style={{ 
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: '500' }}>
                      {item.product_name}
                    </div>
                    {item.cast_name && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999', 
                        marginTop: '2px',
                        fontStyle: 'italic'
                      }}>
                        👤 {item.cast_name}
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    padding: '16px 12px', 
                    textAlign: 'center',
                    fontSize: '16px'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{ 
                    padding: '16px 12px', 
                    textAlign: 'right',
                    fontSize: '16px'
                  }}>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td style={{ 
                    padding: '16px 12px', 
                    textAlign: 'right',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 合計・アクション */}
        <div style={{
          padding: '20px 30px 30px',
          borderTop: '1px solid #e0e0e0',
          marginTop: '20px'
        }}>
          {/* 小計・税・合計の表示 */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f8f8',
            borderRadius: '12px'
          }}>
            <div style={{
              fontSize: '16px',
              lineHeight: '1.8'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                color: '#666'
              }}>
                <span>小計:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(orderItems.reduce((sum, item) => sum + item.subtotal, 0))}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                color: '#666',
                borderBottom: '2px solid #e0e0e0'
              }}>
                <span>サービス料・税:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(selectedReceipt.total_incl_tax - orderItems.reduce((sum, item) => sum + item.subtotal, 0))}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0 8px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                <span>合計:</span>
                <span style={{ color: '#ff9800' }}>{formatCurrency(selectedReceipt.total_incl_tax)}</span>
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => window.print()}
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
              🖨️ 印刷
            </button>
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
      </div>
    </>
  )
}