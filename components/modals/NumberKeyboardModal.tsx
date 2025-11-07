import { FC, useState, useEffect } from 'react'

interface NumberKeyboardModalProps {
  isOpen: boolean
  value: number
  allowDecimal?: boolean
  onValueChange: (value: number) => void
  onClose: () => void
}

export const NumberKeyboardModal: FC<NumberKeyboardModalProps> = ({
  isOpen,
  value,
  allowDecimal = false,
  onValueChange,
  onClose
}) => {
  const [inputValue, setInputValue] = useState('')

  // モーダルが開いたときに初期値を設定
  useEffect(() => {
    if (isOpen) {
      setInputValue(value === 0 ? '' : value.toString())
    }
  }, [isOpen, value])

  if (!isOpen) return null

  // 数字ボタンクリック
  const handleNumberClick = (num: string) => {
    let newValue = inputValue

    // 現在の値が空または0の場合は置き換え
    if (inputValue === '' || inputValue === '0') {
      newValue = num
    } else {
      newValue = inputValue + num
    }

    setInputValue(newValue)
  }

  // 小数点ボタンクリック
  const handleDecimalClick = () => {
    if (!allowDecimal) return
    if (inputValue === '') {
      setInputValue('0.')
    } else if (!inputValue.includes('.')) {
      setInputValue(inputValue + '.')
    }
  }

  // バックスペース（先頭文字削除）
  const handleBackspace = () => {
    if (inputValue.length > 0) {
      // 先頭文字を削除
      setInputValue(inputValue.slice(1))
    }
  }

  // クリア
  const handleClear = () => {
    setInputValue('')
  }

  // 決定
  const handleConfirm = () => {
    const numValue = parseFloat(inputValue) || 0
    onValueChange(numValue)
    onClose()
  }

  // キャンセル
  const handleCancel = () => {
    onClose()
  }

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000
        }}
        onClick={handleCancel}
      />

      {/* キーボードモーダル */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          zIndex: 10001,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          minWidth: '320px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 入力値表示 */}
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'right',
            fontSize: '32px',
            fontWeight: 'bold',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            border: '2px solid #ddd',
            position: 'relative'
          }}
        >
          <span style={{ marginRight: '4px' }}>
            {inputValue || '0'}
          </span>
          {/* カーソル（｜）を末尾に表示 */}
          {inputValue !== '' && (
            <span style={{
              animation: 'blink 1s step-end infinite',
              color: '#FF9800'
            }}>
              |
            </span>
          )}
        </div>

        {/* 数字パッド */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '15px'
          }}
        >
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
                e.currentTarget.style.borderColor = '#FF9800'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#ddd'
              }}
            >
              {num}
            </button>
          ))}

          {/* 0ボタン */}
          <button
            onClick={() => handleNumberClick('0')}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0'
              e.currentTarget.style.borderColor = '#FF9800'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.borderColor = '#ddd'
            }}
          >
            0
          </button>

          {/* 小数点ボタン（allowDecimalがtrueの場合のみ） */}
          {allowDecimal ? (
            <button
              onClick={handleDecimalClick}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
                e.currentTarget.style.borderColor = '#FF9800'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#ddd'
              }}
            >
              .
            </button>
          ) : (
            <button
              onClick={() => handleNumberClick('00')}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
                e.currentTarget.style.borderColor = '#FF9800'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#ddd'
              }}
            >
              00
            </button>
          )}

          {/* バックスペースボタン（先頭文字削除） */}
          <button
            onClick={handleBackspace}
            style={{
              padding: '20px',
              backgroundColor: '#ffebee',
              border: '2px solid #ffcdd2',
              borderRadius: '8px',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#d32f2f',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffcdd2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffebee'
            }}
          >
            ⌫
          </button>
        </div>

        {/* アクションボタン */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}
        >
          {/* クリアボタン */}
          <button
            onClick={handleClear}
            style={{
              padding: '15px',
              backgroundColor: '#e0e0e0',
              border: '2px solid #bdbdbd',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#bdbdbd'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0'
            }}
          >
            クリア
          </button>

          {/* 決定ボタン */}
          <button
            onClick={handleConfirm}
            style={{
              padding: '15px',
              backgroundColor: '#4CAF50',
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: 'white',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50'
            }}
          >
            決定
          </button>
        </div>

        <style jsx>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}</style>
      </div>
    </>
  )
}
