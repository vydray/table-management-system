import { useState } from 'react'
import { useCashCount } from '../../hooks/useCashCount'

interface CashCountModalProps {
  isOpen: boolean
  onClose: () => void
  cashReceipt: number // 現金売上
  registerAmount: number // レジ金
  businessDate: string // 営業日（YYYY-MM-DD形式）
  onComplete: (totalCash: number) => void
}

// 金種の定義
const denominations = [
  { key: 'tenThousand', label: '1万円', value: 10000, type: 'bill' },
  { key: 'fiveThousand', label: '5千円', value: 5000, type: 'bill' },
  { key: 'twoThousand', label: '2千円', value: 2000, type: 'bill' },
  { key: 'thousand', label: '千円', value: 1000, type: 'bill' },
  { key: 'fiveHundred', label: '500円', value: 500, type: 'coin' },
  { key: 'hundred', label: '100円', value: 100, type: 'coin' },
  { key: 'fifty', label: '50円', value: 50, type: 'coin' },
  { key: 'ten', label: '10円', value: 10, type: 'coin' },
  { key: 'five', label: '5円', value: 5, type: 'coin' },
  { key: 'one', label: '1円', value: 1, type: 'coin' },
] as const

type DenominationKey = typeof denominations[number]['key']

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

  // 現在選択中の金種
  const [selectedDenom, setSelectedDenom] = useState<DenominationKey>('tenThousand')

  // 金種の値を取得
  const getDenomValue = (key: DenominationKey): number => {
    const billKeys = ['tenThousand', 'fiveThousand', 'twoThousand', 'thousand'] as const
    if (billKeys.includes(key as typeof billKeys[number])) {
      return bills[key as keyof typeof bills]
    }
    return coins[key as keyof typeof coins]
  }

  // 金種の値を設定
  const setDenomValue = (key: DenominationKey, value: number) => {
    const billKeys = ['tenThousand', 'fiveThousand', 'twoThousand', 'thousand'] as const
    if (billKeys.includes(key as typeof billKeys[number])) {
      setBills({ ...bills, [key]: value })
    } else {
      setCoins({ ...coins, [key]: value })
    }
  }

  // テンキー入力
  const handleNumpadInput = (num: string) => {
    const currentValue = getDenomValue(selectedDenom)
    const newValue = Number(String(currentValue) + num)
    if (newValue <= 9999) {
      setDenomValue(selectedDenom, newValue)
    }
  }

  // テンキークリア
  const handleNumpadClear = () => {
    setDenomValue(selectedDenom, 0)
  }

  // テンキーバックスペース
  const handleNumpadBackspace = () => {
    const currentValue = getDenomValue(selectedDenom)
    const newValue = Math.floor(currentValue / 10)
    setDenomValue(selectedDenom, newValue)
  }

  // 次の金種へ移動
  const handleNext = () => {
    const currentIndex = denominations.findIndex(d => d.key === selectedDenom)
    if (currentIndex < denominations.length - 1) {
      setSelectedDenom(denominations[currentIndex + 1].key)
    }
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
          width: '95%',
          maxWidth: '700px',
          maxHeight: '95vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '2px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            textAlign: 'center'
          }}>
            レジ金計算
          </h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
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

        {/* 本体 - 2カラムレイアウト */}
        <div style={{
          padding: '15px',
          display: 'flex',
          gap: '15px',
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}>
          {/* 左側: 金種入力 */}
          <div style={{
            flex: '1 1 300px',
            minWidth: '280px'
          }}>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '10px'
            }}>
              {/* 金種リスト */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {denominations.map((denom) => {
                  const count = getDenomValue(denom.key)
                  const amount = count * denom.value
                  const isSelected = selectedDenom === denom.key

                  return (
                    <div
                      key={denom.key}
                      onClick={() => setSelectedDenom(denom.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: isSelected ? '#e3f2fd' : 'white',
                        border: isSelected ? '2px solid #2196f3' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: '60px',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {denom.label}
                      </span>
                      <span style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: isSelected ? '#2196f3' : '#333'
                      }}>
                        {count}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666' }}>枚</span>
                      <span style={{
                        width: '80px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        ¥{amount.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* 合計・レジ金・現金回収 */}
              <div style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#e8e8e8',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #ccc'
                }}>
                  <span style={{ fontWeight: 'bold' }}>合計</span>
                  <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2196f3' }}>
                    ¥{total.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #ccc'
                }}>
                  <span>レジ金</span>
                  <span style={{ color: '#f44336' }}>
                    -¥{registerAmount.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0 4px 0'
                }}>
                  <span style={{ fontWeight: 'bold' }}>現金回収</span>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '20px',
                    color: '#2196f3'
                  }}>
                    ¥{cashCollection.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: テンキー */}
          <div style={{
            flex: '0 0 180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* 現在選択中の表示 */}
            <div style={{
              padding: '10px',
              backgroundColor: '#2196f3',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                {denominations.find(d => d.key === selectedDenom)?.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {getDenomValue(selectedDenom)}枚
              </div>
            </div>

            {/* テンキーグリッド */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px'
            }}>
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumpadInput(String(num))}
                  style={{
                    padding: '15px 0',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleNumpadClear}
                style={{
                  padding: '15px 0',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '1px solid #f44336',
                  borderRadius: '8px',
                  backgroundColor: '#ffebee',
                  color: '#f44336',
                  cursor: 'pointer'
                }}
              >
                C
              </button>
              <button
                onClick={() => handleNumpadInput('0')}
                style={{
                  padding: '15px 0',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                0
              </button>
              <button
                onClick={handleNumpadBackspace}
                style={{
                  padding: '15px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
            </div>

            {/* 次へボタン */}
            <button
              onClick={handleNext}
              style={{
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#4caf50',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              次へ ↓
            </button>
          </div>
        </div>

        {/* 差額表示 */}
        <div style={{
          margin: '0 15px',
          padding: '10px 15px',
          backgroundColor: cashCollection === cashReceipt ? '#e8f5e9' : '#ffebee',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>現金売上との差額</span>
          <span style={{
            fontWeight: 'bold',
            fontSize: '18px',
            color: cashCollection === cashReceipt ? '#4caf50' : '#f44336'
          }}>
            ¥{(cashCollection - cashReceipt).toLocaleString()}
          </span>
        </div>

        {/* ボタン */}
        <div style={{
          padding: '15px',
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
              borderRadius: '8px',
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
              padding: '12px 40px',
              backgroundColor: isSaving ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
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
  )
}
