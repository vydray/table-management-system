import { useEffect } from 'react'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import '../styles/globals.css' // グローバルスタイルをインポート（もしあれば）

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // ログインページは認証チェックをスキップ
    if (router.pathname === '/login') {
      return
    }

    // ログイン状態をチェック
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
      // ログインしていない場合はログインページにリダイレクト
      router.push('/login')
    }
  }, [router.pathname, router])

  return <Component {...pageProps} />
}