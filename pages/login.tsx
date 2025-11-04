import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 入力フィールドにフォーカスが当たったときにキーボードを表示
  const handleInputFocus = async () => {
    try {
      // Capacitorがネイティブ環境で利用可能な場合のみKeyboardプラグインを使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        const { Keyboard } = await import('@capacitor/keyboard')
        await Keyboard.show()
      }
    } catch (error) {
      console.log('Keyboard API not available or error:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('username', data.username)
        localStorage.setItem('userId', data.userId.toString())
        localStorage.setItem('currentStoreId', data.storeId.toString())
        localStorage.setItem('userRole', data.role)

        console.log(`ログイン成功: ${data.username} (店舗ID: ${data.storeId})`)
        router.push('/')
      } else {
        setError(data.error || 'ログインに失敗しました')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>ログイン - テーブル管理システム</title>
      </Head>

      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>📋 テーブル管理システム</h1>
            <p>ログインしてください</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">ユーザー名</label>
              <input
                type="text"
                inputMode="text"
                lang="ja"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="ユーザー名を入力"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="パスワードを入力"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="login-footer">
            <p>パスワードを忘れた場合は管理者にお問い合わせください</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .login-box {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header h1 {
          font-size: 28px;
          margin: 0 0 10px 0;
          color: #333;
        }

        .login-header p {
          color: #666;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          background-color: #f7f9fc;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          background-color: white;
        }

        .form-group input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 14px;
          border: 1px solid #fcc;
        }

        .login-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .login-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          box-shadow: none;
        }

        .login-footer {
          margin-top: 20px;
          text-align: center;
        }

        .login-footer p {
          color: #999;
          font-size: 12px;
        }
      `}</style>
    </>
  )
}