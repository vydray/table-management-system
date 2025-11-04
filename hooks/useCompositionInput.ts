import { useRef, useCallback } from 'react'

/**
 * IME（日本語入力など）に対応した入力フック
 * Reactの制御されたコンポーネントでIME入力が正しく動作するようにする
 */
export const useCompositionInput = () => {
  const isComposing = useRef(false)

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    isComposing.current = false
  }, [])

  const handleChange = useCallback(
    (callback: (value: string) => void) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // IME変換中でなければ即座に更新
        if (!isComposing.current) {
          callback(e.target.value)
        }
      }
    },
    []
  )

  const handleCompositionEndWithChange = useCallback(
    (callback: (value: string) => void) => {
      return (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        isComposing.current = false
        // IME変換確定時に値を更新
        callback((e.target as HTMLInputElement | HTMLTextAreaElement).value)
      }
    },
    []
  )

  return {
    compositionProps: {
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEndWithChange,
    },
    handleChange,
  }
}
