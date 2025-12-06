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

  const [selectedDenom, setSelectedDenom] = useState<DenominationKey>('tenThousand')

  const getDenomValue = (key: DenominationKey): number => {
    const billKeys = ['tenThousand', 'fiveThousand', 'twoThousand', 'thousand'] as const
    if (billKeys.includes(key as typeof billKeys[number])) {
      return bills[key as keyof typeof bills]
    }
    return coins[key as keyof typeof coins]
  }

  const setDenomValue = (key: DenominationKey, value: number) => {
    const billKeys = ['tenThousand', 'fiveThousand', 'twoThousand', 'thousand'] as const
    if (billKeys.includes(key as typeof billKeys[number])) {
      setBills({ ...bills, [key]: value })
    } else {
      setCoins({ ...coins, [key]: value })
    }
  }

  const handleNumpadInput = (num: string) => {
    const currentValue = getDenomValue(selectedDenom)
    const newValue = Number(String(currentValue) + num)
    if (newValue <= 9999) {
      setDenomValue(selectedDenom, newValue)
    }
  }

  const handleNumpadClear = () => {
    setDenomValue(selectedDenom, 0)
  }

  const handleNumpadBackspace = () => {
    const currentValue = getDenomValue(selectedDenom)
    const newValue = Math.floor(currentValue / 10)
    setDenomValue(selectedDenom, newValue)
  }

  const handleNext = () => {
    const currentIndex = denominations.findIndex(d => d.key === selectedDenom)
    if (currentIndex < denominations.length - 1) {
      setSelectedDenom(denominations[currentIndex + 1].key)
    }
  }

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
          borderRadius: '12px',
          width: '480px',
          overflow: 'hidden'
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f8f8'
        }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>レジ金計算</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* 本体 */}
        <div style={{ padding: '12px', display: 'flex', gap: '12px' }}>
          {/* 左側: 金種リスト */}
          <div style={{ width: '260px' }}>
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
                    padding: '8px 10px',
                    marginBottom: '3px',
                    backgroundColor: isSelected ? '#e3f2fd' : '#fafafa',
                    border: isSelected ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: '65px', fontSize: '13px' }}>{denom.label}</span>
                  <span style={{
                    width: '45px',
                    textAlign: 'right',
                    fontSize: '17px',
                    fontWeight: 'bold',
                    color: isSelected ? '#2196f3' : '#333'
                  }}>
                    {count}
                  </span>
                  <span style={{ fontSize: '11px', color: '#888', marginLeft: '2px' }}>枚</span>
                  <span style={{
                    flex: 1,
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    ¥{amount.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 右側: テンキー */}
          <div style={{ width: '180px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
              flex: 1
            }}>
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumpadInput(String(num))}
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleNumpadClear}
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '1px solid #ef5350',
                  borderRadius: '6px',
                  backgroundColor: '#ffebee',
                  color: '#ef5350',
                  cursor: 'pointer'
                }}
              >
                AC
              </button>
              <button
                onClick={() => handleNumpadInput('0')}
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                0
              </button>
              <button
                onClick={handleNumpadBackspace}
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
            </div>
            <button
              onClick={handleNext}
              style={{
                marginTop: '4px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#4caf50',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              次へ ↓
            </button>
          </div>
        </div>

        {/* 合計エリア */}
        <div style={{
          margin: '0 12px',
          padding: '10px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px' }}>合計</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2196f3' }}>¥{total.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px' }}>レジ金</span>
            <span style={{ fontSize: '14px', color: '#f44336' }}>-¥{registerAmount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>現金回収</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196f3' }}>¥{cashCollection.toLocaleString()}</span>
          </div>
        </div>

        {/* 差額 */}
        <div style={{
          margin: '8px 12px',
          padding: '8px 12px',
          backgroundColor: cashCollection === cashReceipt ? '#e8f5e9' : '#ffebee',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px' }}>理論値との差額</span>
          <span style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: cashCollection === cashReceipt ? '#4caf50' : '#f44336'
          }}>
            ¥{(cashCollection - cashReceipt).toLocaleString()}
          </span>
        </div>

        {/* ボタン */}
        <div style={{ padding: '8px 12px 12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={resetCount}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            リセット
          </button>
          <button
            onClick={handleComplete}
            disabled={isSaving}
            style={{
              flex: 2,
              padding: '12px',
              backgroundColor: isSaving ? '#bdbdbd' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '15px',
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
