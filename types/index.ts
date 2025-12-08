// テーブルの型定義
export interface TableData {
  table: string
  name: string
  oshi: string[]
  time: string
  visit: string
  elapsed: string
  status: 'empty' | 'occupied'
  page_number?: number
}

// 注文アイテムの型定義
export interface OrderItem {
  name: string
  cast?: string[]
  quantity: number
  price: number
}

// 商品の型定義
export interface ProductItem {
  id: number
  price: number
  needsCast: boolean
  discountRate: number
}

// 商品カテゴリーの型定義
export interface ProductCategories {
  [category: string]: {
    [subcategory: string]: ProductItem
  }
}

// DBから取得する商品カテゴリーの型
export interface ProductCategory {
  id: number
  name: string
  display_order: number
  show_oshi_first?: boolean
}

// DBから取得する商品の型
export interface Product {
  id: number
  category_id: number
  name: string
  price: number
  tax_rate: number
  discount_rate: number
  needs_cast: boolean
  is_active: boolean
  display_order: number
}