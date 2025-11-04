import { useRef, useCallback } from 'react'

/**
 * IME（日本語入力など）に対応した入力フック
 * Reactの制御されたコンポーネントでIME入力が正しく動作するようにする
 *
 * Android WebView特有の問題に対応するため、より柔軟なアプローチを採用
 */
export const useCompositionInput = () => {
  const isComposing = useRef(false)
  const lastValue = useRef('')

  const handleCompositionStart = useCallback(() => {
    console.log('[IME] Composition started')
    isComposing.current = true
  }, [])

  const handleCompositionUpdate = useCallback(() => {
    console.log('[IME] Composition updating')
    isComposing.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    console.log('[IME] Composition ended')
    isComposing.current = false
  }, [])

  const handleChange = useCallback(
    (callback: (value: string) => void) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value
        console.log('[IME] onChange:', newValue, 'isComposing:', isComposing.current)

        // Android WebViewでは常に更新を許可（IME状態に関係なく）
        // これによりIME変換中もリアルタイムで表示が更新される
        callback(newValue)
        lastValue.current = newValue
      }
    },
    []
  )

  const handleCompositionEndWithChange = useCallback(
    (callback: (value: string) => void) => {
      return (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const finalValue = (e.target as HTMLInputElement | HTMLTextAreaElement).value
        console.log('[IME] Composition ended with value:', finalValue)
        isComposing.current = false

        // 最終確定値を更新
        if (finalValue !== lastValue.current) {
          callback(finalValue)
          lastValue.current = finalValue
        }
      }
    },
    []
  )

  return {
    compositionProps: {
      onCompositionStart: handleCompositionStart,
      onCompositionUpdate: handleCompositionUpdate,
      onCompositionEnd: handleCompositionEndWithChange,
    },
    handleChange,
  }
}
