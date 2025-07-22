import { FC } from 'react'

interface NumberPadProps {
  currentValue: number
  layoutScale: number
  onNumberClick: (num: string) => void
  onQuickAmount: (amount: number) => void
  onDeleteNumber: () => void
  onClearNumber: () => void
}

export const NumberPad: FC<NumberPadProps> = ({
  currentValue,
  layoutScale,
  onNumberClick,
  onQuickAmount,
  onDeleteNumber,
  onClearNumber
}) => {
  return (
    <div style={{
      width: `${350 * layoutScale}px`,
      backgroundColor: '#f5f5f5',
      padding: `${30 * layoutScale}px`,
      borderLeft: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 現在の入力値表示 */}
      <div style={{
        backgroundColor: 'white',
        padding: `${20 * layoutScale}px`,
        borderRadius: '8px',
        marginBottom: `${20 * layoutScale}px`,
        textAlign: 'right',
        fontSize: `${32 * layoutScale}px`,
        fontWeight: 'bold',
        minHeight: `${60 * layoutScale}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
        ¥{(currentValue || 0).toLocaleString()}
      </div>

      {/* クイック金額ボタン */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: `${10 * layoutScale}px`,
        marginBottom: `${20 * layoutScale}px`
      }}>
        <button
          onClick={() => onQuickAmount(1000)}
          style={{
            padding: `${12 * layoutScale}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: `${14 * layoutScale}px`,
            cursor: 'pointer'
          }}
        >
          ¥1,000
        </button>
        <button
          onClick={() => onQuickAmount(5000)}
          style={{
            padding: `${12 * layoutScale}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: `${14 * layoutScale}px`,
            cursor: 'pointer'
          }}
        >
          ¥5,000
        </button>
        <button
          onClick={() => onQuickAmount(10000)}
          style={{
            padding: `${12 * layoutScale}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: `${14 * layoutScale}px`,
            cursor: 'pointer'
          }}
        >
          ¥10,000
        </button>
      </div>

      {/* 数字パッド */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: `${10 * layoutScale}px`,
        flex: 1
      }}>
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
          <button
            key={num}
            onClick={() => onNumberClick(num.toString())}
            style={{
              padding: `${20 * layoutScale}px`,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: `${24 * layoutScale}px`,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {num}
          </button>
        ))}
        
        <button
          onClick={() => onNumberClick('0')}
          style={{
            padding: `${20 * layoutScale}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: `${24 * layoutScale}px`,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          0
        </button>
        
        <button
          onClick={() => onNumberClick('00')}
          style={{
            padding: `${20 * layoutScale}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: `${24 * layoutScale}px`,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          00
        </button>
        
        <button
          onClick={onDeleteNumber}
          style={{
            padding: `${20 * layoutScale}px`,
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            fontSize: `${20 * layoutScale}px`,
            cursor: 'pointer',
            color: '#d32f2f'
          }}
        >
          ←
        </button>
      </div>

      {/* クリアボタン */}
      <button
        onClick={onClearNumber}
        style={{
          marginTop: `${20 * layoutScale}px`,
          padding: `${15 * layoutScale}px`,
          backgroundColor: '#e0e0e0',
          border: '1px solid #bdbdbd',
          borderRadius: '8px',
          fontSize: `${18 * layoutScale}px`,
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        クリア
      </button>
    </div>
  )
}