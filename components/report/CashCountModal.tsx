import { useCashCount } from '../../hooks/useCashCount'

interface CashCountModalProps {
  isOpen: boolean
  onClose: () => void
  cashReceipt: number // 現金売上
  registerAmount: number // レジ金
  businessDate: string // 営業日（YYYY-MM-DD形式）
  onComplete: (totalCash: number) => void
}

export default function CashCountModal({
  isOpen,
  onClose,
  cashReceipt,
  registerAmount,
  businessDate,
  onComplete
}: CashCountModalProps) {
  const {
    bills,
    setBills,
    coins,
    setCoins,
    isSaving,
    calculateTotal,
    resetCount,
    saveCashCount
  } = useCashCount(businessDate, isOpen)

  const total = calculateTotal()
  const cashCollection = total - registerAmount

  // 完了処理
  const handleComplete = async () => {
    const result = await saveCashCount(registerAmount)
    if (result !== null) {
      onComplete(result)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '24px',
            textAlign: 'center'
          }}>
            レジ金計算
          </h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* 本体 */}
        <div style={{ padding: '20px' }}>
          {/* 紙幣セクション */}
          <div style={{
            backgroundColor: '#fff9e6',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0',
              fontSize: '18px',
              color: '#ff9800'
            }}>
              紙幣
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ffcc80' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>種類</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>枚数</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>単位</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>金額</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px' }}>1万円札</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={bills.tenThousand}
                      onChange={(e) => setBills({...bills, tenThousand: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(bills.tenThousand * 10000).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>5千円札</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={bills.fiveThousand}
                      onChange={(e) => setBills({...bills, fiveThousand: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(bills.fiveThousand * 5000).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>2千円札</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={bills.twoThousand}
                      onChange={(e) => setBills({...bills, twoThousand: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(bills.twoThousand * 2000).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>千円札</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={bills.thousand}
                      onChange={(e) => setBills({...bills, thousand: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(bills.thousand * 1000).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 硬貨セクション */}
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0',
              fontSize: '18px',
              color: '#666'
            }}>
              硬貨
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>種類</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>枚数</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>単位</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>金額</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px' }}>500円玉</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={coins.fiveHundred}
                      onChange={(e) => setCoins({...coins, fiveHundred: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(coins.fiveHundred * 500).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>100円玉</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={coins.hundred}
                      onChange={(e) => setCoins({...coins, hundred: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(coins.hundred * 100).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>50円玉</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={coins.fifty}
                      onChange={(e) => setCoins({...coins, fifty: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(coins.fifty * 50).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>10円玉</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={coins.ten}
                      onChange={(e) => setCoins({...coins, ten: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(coins.ten * 10).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>5円玉</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={coins.five}
                      onChange={(e) => setCoins({...coins, five: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(coins.five * 5).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>1円玉</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={coins.one}
                      onChange={(e) => setCoins({...coins, one: Number(e.target.value)})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>枚</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{coins.one}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 計算結果 */}
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <table style={{ width: '100%', fontSize: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '10px' }}>合計</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }}>
                    ¥{total.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>レジ金</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#f44336' }}>
                    -¥{registerAmount.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderTop: '2px solid #2196f3' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>現金回収額</td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'right', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: '#2196f3'
                  }}>
                    ¥{cashCollection.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#bbdefb',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <div>現金売上: ¥{cashReceipt.toLocaleString()}</div>
              <div style={{ 
                fontWeight: 'bold',
                marginTop: '5px',
                color: cashCollection === cashReceipt ? '#4caf50' : '#f44336'
              }}>
                差額: ¥{(cashCollection - cashReceipt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center'
          }}>
            <button
              onClick={resetCount}
              style={{
                padding: '12px 24px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              リセット
            </button>
            <button
              onClick={handleComplete}
              disabled={isSaving}
              style={{
                padding: '12px 32px',
                backgroundColor: isSaving ? '#ccc' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isSaving ? '保存中...' : '確定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}