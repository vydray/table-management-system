import { FC, useState } from 'react'
import { NumberKeyboardModal } from './modals/NumberKeyboardModal'

interface NumericInputProps {
  value: number | string
  onChange: (value: number) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  style?: React.CSSProperties
  label?: string
  allowDecimal?: boolean
  width?: string
}

export const NumericInput: FC<NumericInputProps> = ({
  value,
  onChange,
  placeholder = '',
  min,
  max,
  disabled = false,
  style = {},
  label,
  allowDecimal = false,
  width = '100%'
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false)

  const handleValueChange = (newValue: number) => {
    // min/maxの範囲チェック
    if (min !== undefined && newValue < min) {
      onChange(min)
    } else if (max !== undefined && newValue > max) {
      onChange(max)
    } else {
      onChange(newValue)
    }
  }

  const displayValue = typeof value === 'number'
    ? (value === 0 ? '' : value.toString())
    : value

  return (
    <>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setShowKeyboard(true)
          }
        }}
        style={{
          width,
          padding: '12px',
          fontSize: '16px',
          border: '2px solid #ddd',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          ...style
        }}
      />

      <NumberKeyboardModal
        isOpen={showKeyboard}
        value={typeof value === 'number' ? value : parseFloat(value) || 0}
        allowDecimal={allowDecimal}
        onValueChange={handleValueChange}
        onClose={() => setShowKeyboard(false)}
      />
    </>
  )
}
