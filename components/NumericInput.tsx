import { FC, useRef, useState } from 'react'
import { useKeyboard } from '../contexts/KeyboardContext'

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
  const { showKeyboard, hideKeyboard, isVisible } = useKeyboard()
  const [localValue, setLocalValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const localValueRef = useRef('')

  const handleFocus = () => {
    if (disabled) return

    setIsFocused(true)

    // 値が0の場合は空文字から始める
    const initialValue = value === 0 || value === '0' ? '' : value.toString()
    setLocalValue(initialValue)
    localValueRef.current = initialValue

    showKeyboard(
      initialValue,
      (newValue: string) => {
        // キーボードからの入力を受け取る
        setLocalValue(newValue)
        localValueRef.current = newValue

        // 空の場合は0
        if (newValue === '') {
          onChange(0)
          return
        }

        // 数字のみまたは小数点を許可（数字、小数点、マイナスのみ）
        const sanitized = newValue.replace(/[^\d.-]/g, '')
        const numericValue = allowDecimal ? parseFloat(sanitized) : parseInt(sanitized)

        if (isNaN(numericValue)) {
          return
        }

        // min/maxの範囲チェック
        if (min !== undefined && numericValue < min) {
          onChange(min)
        } else if (max !== undefined && numericValue > max) {
          onChange(max)
        } else {
          onChange(numericValue)
        }
      },
      () => localValueRef.current,
      {
        preferredMode: 'number',
        deleteFromFront: false
      }
    )
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // キーボードのボタンクリック時はblurを無視
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.closest('.japanese-keyboard')) {
      e.preventDefault()
      inputRef.current?.focus()
      return
    }

    setIsFocused(false)
    hideKeyboard()
  }

  // キーボードが開いている間はlocalValueを表示、閉じている時は通常のvalueを表示
  const displayValue = (isFocused && isVisible)
    ? localValue
    : (typeof value === 'number' ? (value === 0 ? '' : value.toString()) : value)

  return (
    <>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width, display: 'inline-block' }}>
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px',
            paddingRight: isFocused && isVisible && localValue ? '24px' : '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            ...style
          }}
        />
        {/* カーソル表示 - 文字の直後に配置 */}
        {isFocused && isVisible && localValue && (
          <span
            style={{
              position: 'absolute',
              left: `calc(12px + ${localValue.length * 9}px)`,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#FF9800',
              animation: 'blink 1s step-end infinite',
              pointerEvents: 'none'
            }}
          >
            |
          </span>
        )}
      </div>
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
