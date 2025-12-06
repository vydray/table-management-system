import { useState } from 'react'
import { useCashCount } from '../../hooks/useCashCount'

interface CashCountModalProps {
  isOpen: boolean
  onClose: () => void
  cashReceipt: number // 理論上の現金回収額（現金売上 - 日払い - 経費 - 未収金等）
  registerAmount: number // レジ金
  businessDate: string // 営業日（YYYY-MM-DD形式）
  onComplete: (totalCash: number) => void
}

// 金種の定義
const denominations = [
  { key: 'tenThousand', label: '1万円札', value: 10000 },
  { key: 'fiveThousand', label: '5千円札', value: 5000 },
  { key: 'twoThousand', label: '2千円札', value: 2000 },
  { key: 'thousand', label: '千円札', value: 1000 },
  { key: 'fiveHundred', label: '500円玉', value: 500 },
  { key: 'hundred', label: '100円玉', value: 100 },
  { key: 'fifty', label: '50円玉', value: 50 },
  { key: 'ten', label: '10円玉', value: 10 },
  { key: 'five', label: '5円玉', value: 5 },
  { key: 'one', label: '1円玉', value: 1 },
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

  const numpadButtonStyle = {
    padding: '18px 0',
    fontSize: '22px',
    fontWeight: 'bold' as const,
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
  }

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
          maxWidth: '600px',
          maxHeight: '95vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding: '12px 15px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>レジ金計算</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>

        {/* 本体 */}
        <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
          {/* 左側: 金種リスト */}
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <div style={{
              backgroundColor: '#f8f8f8',
              borderRadius: '8px',
              padding: '8px'
            }}>
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
                      padding: '10px 12px',
                      marginBottom: '4px',
                      backgroundColor: isSelected ? '#e3f2fd' : 'white',
                      border: isSelected ? '2px solid #2196f3' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      flex: '0 0 70px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {denom.label}
                    </span>
                    <span style={{
                      flex: '0 0 50px',
                      textAlign: 'right',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: isSelected ? '#2196f3' : '#333'
                    }}>
                      {count}
                    </span>
                    <span style={{
                      flex: '0 0 20px',
                      fontSize: '12px',
                      color: '#666',
                      marginLeft: '4px'
                    }}>
                      枚
                    </span>
                    <span style={{
                      flex: 1,
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      ¥{amount.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 合計表示 */}
            <div style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#e8e8e8',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span>合計</span>
                <span style={{ fontWeight: 'bold', color: '#2196f3', fontSize: '16px' }}>¥{total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span>レジ金</span>
                <span style={{ color: '#f44336' }}>-¥{registerAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 'bold' }}>現金回収</span>
                <span style={{ fontWeight: 'bold', color: '#2196f3', fontSize: '18px' }}>¥{cashCollection.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 右側: テンキー */}
          <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* テンキーグリッド */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '5px',
              flex: 1
            }}>
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumpadInput(String(num))}
                  style={numpadButtonStyle}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleNumpadClear}
                style={{
                  ...numpadButtonStyle,
                  backgroundColor: '#ffebee',
                  color: '#f44336',
                  border: '1px solid #f44336',
                  fontSize: '14px'
                }}
              >
                AC
              </button>
              <button
                onClick={() => handleNumpadInput('0')}
                style={numpadButtonStyle}
              >
                0
              </button>
              <button
                onClick={handleNumpadBackspace}
                style={{
                  ...numpadButtonStyle,
                  backgroundColor: '#f5f5f5',
                  fontSize: '18px'
                }}
              >
                ←
              </button>
            </div>

            {/* 次へボタン */}
            <button
              onClick={handleNext}
              style={{
                padding: '14px',
                fontSize: '15px',
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
          margin: '0 10px 10px',
          padding: '10px 12px',
          backgroundColor: cashCollection === cashReceipt ? '#e8f5e9' : '#ffebee',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span>理論値との差額</span>
          <span style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: cashCollection === cashReceipt ? '#4caf50' : '#f44336'
          }}>
            ¥{(cashCollection - cashReceipt).toLocaleString()}
          </span>
        </div>

        {/* ボタン */}
        <div style={{
          padding: '10px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={resetCount}
            style={{
              flex: 1,
              padding: '14px',
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
              flex: 2,
              padding: '14px',
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
