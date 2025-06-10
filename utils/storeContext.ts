// utils/storeContext.ts
// 店舗IDの管理用ユーティリティ

const STORE_ID_KEY = 'currentStoreId'
const DEFAULT_STORE_ID = 1 // デフォルトは本店

// 現在の店舗IDを取得
export const getCurrentStoreId = (): number => {
  if (typeof window === 'undefined') return DEFAULT_STORE_ID
  
  const storeId = localStorage.getItem(STORE_ID_KEY)
  return storeId ? parseInt(storeId) : DEFAULT_STORE_ID
}

// 店舗IDを設定
export const setCurrentStoreId = (storeId: number): void => {
  localStorage.setItem(STORE_ID_KEY, storeId.toString())
}

// 店舗IDをクリア
export const clearCurrentStoreId = (): void => {
  localStorage.removeItem(STORE_ID_KEY)
}