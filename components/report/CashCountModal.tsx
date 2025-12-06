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
  { key: 'tenThousand', label: '1万', value: 10000 },
  { key: 'fiveThousand', label: '5千', value: 5000 },
  { key: 'twoThousand', label: '2千', value: 2000 },
  { key: 'thousand', label: '千', value: 1000 },
  { key: 'fiveHundred', label: '500', value: 500 },
  { key: 'hundred', label: '100', value: 100 },
  { key: 'fifty', label: '50', value: 50 },
  { key: 'ten', label: '10', value: 10 },
  { key: 'five', label: '5', value: 5 },
  { key: 'one', label: '1', value: 1 },
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
    padding: '20px 0',
    fontSize: '24px',
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
          maxWidth: '500px',
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
          <div style={{ flex: '0 0 140px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px'
            }}>
              {denominations.map((denom) => {
                const count = getDenomValue(denom.key)
                const isSelected = selectedDenom === denom.key

                return (
                  <div
                    key={denom.key}
                    onClick={() => setSelectedDenom(denom.key)}
                    style={{
                      padding: '8px 4px',
                      backgroundColor: isSelected ? '#2196f3' : '#f5f5f5',
                      color: isSelected ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{denom.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{count}</div>
                  </div>
                )
              })}
            </div>

            {/* 合計表示 */}
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              borderRadius: '6px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>合計</span>
                <span style={{ fontWeight: 'bold', color: '#2196f3' }}>¥{total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>レジ金</span>
                <span style={{ color: '#f44336' }}>-¥{registerAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>回収</span>
                <span style={{ fontWeight: 'bold', color: '#2196f3' }}>¥{cashCollection.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 右側: テンキー */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* テンキーグリッド */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
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
                  fontSize: '16px'
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
                  fontSize: '20px'
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
                fontSize: '16px',
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
          padding: '10px',
          backgroundColor: cashCollection === cashReceipt ? '#e8f5e9' : '#ffebee',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span>現金売上との差額</span>
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
