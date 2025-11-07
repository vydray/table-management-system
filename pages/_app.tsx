import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { KeyboardProvider, useKeyboard } from '../contexts/KeyboardContext'
import JapaneseKeyboard from '../components/JapaneseKeyboard'
import { useKeyboardAutoAttach } from '../hooks/useKeyboardAutoAttach'

function AppContent({ Component, pageProps }: AppProps) {
  const keyboard = useKeyboard();
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 全てのinput要素に自動的にカスタムキーボードをアタッチ
  useKeyboardAutoAttach();

  useEffect(() => {
    // ログインページは認証チェックをスキップ
    if (router.pathname === '/login') {
      setIsCheckingAuth(false)
      return
    }

    // ログイン状態をチェック
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn')

      if (!isLoggedIn || isLoggedIn !== 'true') {
        // ログインしていない場合はログインページにリダイレクト
        router.push('/login')
      } else {
        setIsCheckingAuth(false)
      }
    }

    // router準備完了後に認証チェック
    if (router.isReady) {
      checkAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.pathname])

  // 認証チェック中は何も表示しない（白い画面を防ぐ）
  if (isCheckingAuth && router.pathname !== '/login') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f8f8'
      }}>
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <>
      <Component {...pageProps} />
      {keyboard.isVisible && (
        <JapaneseKeyboard
          onChange={keyboard.updateValue}
          onClose={keyboard.hideKeyboard}
          getInputValue={keyboard.getInputValue}
        />
      )}
    </>
  )
}

export default function App(props: AppProps) {
  return (
    <KeyboardProvider>
      <AppContent {...props} />
    </KeyboardProvider>
  )
}