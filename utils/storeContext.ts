// 店舗IDを管理するユーティリティ

// 現在の店舗IDを取得
export const getCurrentStoreId = (): number => {
  // localStorageから店舗IDを取得
  const storeId = localStorage.getItem('currentStoreId')
  
  if (storeId) {
    return parseInt(storeId, 10)
  }
  
  // 未ログインまたは店舗IDが設定されていない場合
  console.warn('店舗IDが設定されていません。ログインが必要です。')
  
  // ログインページにリダイレクト（ブラウザ環境の場合）
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
  
  // デフォルト値として1を返す（エラー回避のため）
  return 1
}

// ログインチェック
export const checkAuth = (): boolean => {
  if (typeof window === 'undefined') {
    return true // サーバーサイドでは常にtrue
  }
  
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  const storeId = localStorage.getItem('currentStoreId')
  
  return isLoggedIn === 'true' && !!storeId
}

// ログアウト処理
export const logout = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('username')
  localStorage.removeItem('currentStoreId')
  localStorage.removeItem('userRole')
  
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}