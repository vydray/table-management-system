import { useRef } from 'react'
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

  // 入力フィールドへの参照
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // エンターキーで次のフィールドに移動
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < inputRefs.current.length) {
        inputRefs.current[nextIndex]?.focus()
      }
    }
  }

  // フォーカス時の処理：カーソルを末尾に移動、0の場合は空にする
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target
    const value = input.value

    // 0の場合は空にする
    if (value === '0') {
      input.value = ''
    }

    // カーソルを末尾に移動
    setTimeout(() => {
      const len = input.value.length
      input.setSelectionRange(len, len)
    }, 0)
  }

  // 数字のみ許可
  const handleNumberChange = (value: string, setter: (val: number) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setter(numericValue === '' ? 0 : Number(numericValue))
  }

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
    <div
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
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
                      ref={(el) => { inputRefs.current[0] = el }}
                      type="text"
                      value={bills.tenThousand}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setBills({...bills, tenThousand: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 0)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[1] = el }}
                      type="text"
                      value={bills.fiveThousand}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setBills({...bills, fiveThousand: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[2] = el }}
                      type="text"
                      value={bills.twoThousand}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setBills({...bills, twoThousand: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 2)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[3] = el }}
                      type="text"
                      value={bills.thousand}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setBills({...bills, thousand: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 3)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[4] = el }}
                      type="text"
                      value={coins.fiveHundred}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setCoins({...coins, fiveHundred: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 4)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[5] = el }}
                      type="text"
                      value={coins.hundred}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setCoins({...coins, hundred: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 5)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[6] = el }}
                      type="text"
                      value={coins.fifty}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setCoins({...coins, fifty: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 6)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[7] = el }}
                      type="text"
                      value={coins.ten}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setCoins({...coins, ten: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 7)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[8] = el }}
                      type="text"
                      value={coins.five}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setCoins({...coins, five: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 8)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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
                      ref={(el) => { inputRefs.current[9] = el }}
                      type="text"
                      value={coins.one}
                      onChange={(e) => handleNumberChange(e.target.value, (val) => setCoins({...coins, one: val}))}
                      onFocus={handleNumberFocus}
                      onKeyDown={(e) => handleKeyDown(e, 9)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
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