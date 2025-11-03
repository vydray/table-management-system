// 店舗IDとユーザーIDを管理するユーティリティ

// 現在のユーザーIDを取得
export const getCurrentUserId = (): number => {
  // サーバーサイドレンダリング対応
  if (typeof window === 'undefined') {
    return 0
  }

  // localStorageからユーザーIDを取得
  const userId = localStorage.getItem('userId')

  if (userId) {
    const id = parseInt(userId, 10)
    if (!isNaN(id) && id > 0) {
      return id
    }
  }

  // ユーザーIDが設定されていない場合
  console.warn('ユーザーIDが設定されていません')

  // エラー判定用に0を返す
  return 0
}

// 現在の店舗IDを取得
export const getCurrentStoreId = (): number => {
  // サーバーサイドレンダリング対応
  if (typeof window === 'undefined') {
    return 0
  }
  
  // localStorageから店舗IDを取得
  const storeId = localStorage.getItem('currentStoreId')
  
  if (storeId) {
    const id = parseInt(storeId, 10)
    if (!isNaN(id) && id > 0) {
      return id
    }
  }
  
  // 店舗IDが設定されていない場合
  console.warn('店舗IDが設定されていません')
  
  // ログインページ以外でログインしていない場合はリダイレクト
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  if (!isLoggedIn && window.location.pathname !== '/login') {
    console.log('未ログインのためログインページへリダイレクト')
    window.location.href = '/login'
  }
  
  // エラー判定用に0を返す
  return 0
}

// 店舗IDを設定する関数
export const setCurrentStoreId = (storeId: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentStoreId', storeId.toString())
  }
}

// ログインチェック
export const checkAuth = (): boolean => {
  if (typeof window === 'undefined') {
    return true // サーバーサイドでは常にtrue
  }
  
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  const storeId = localStorage.getItem('currentStoreId')
  
  return isLoggedIn === 'true' && !!storeId && parseInt(storeId) > 0
}

// ログアウト処理
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    localStorage.removeItem('currentStoreId')
    localStorage.removeItem('userRole')

    window.location.href = '/login'
  }
}