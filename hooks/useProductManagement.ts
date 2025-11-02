import { useState } from 'react'
import { ProductCategories, ProductCategory, Product } from '../types'
import { getCurrentStoreId } from '../utils/storeContext'

export const useProductManagement = () => {
  const [productCategories, setProductCategories] = useState<ProductCategories>({})
  const [productCategoriesData, setProductCategoriesData] = useState<ProductCategory[]>([])
  const [castList, setCastList] = useState<string[]>([])

  // 商品データをAPIから取得
  const loadProducts = async () => {
    try {
      console.log('商品データ読み込み開始...')

      // ログインチェック
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (!isLoggedIn) {
        console.log('未ログインのため商品データ読み込みをスキップ')
        return
      }

      // 店舗IDを取得
      const storeId = getCurrentStoreId()
      if (!storeId) {
        console.log('店舗IDが取得できないため商品データ読み込みをスキップ')
        return
      }

      // APIに店舗IDを渡す
      const res = await fetch(`/api/products?storeId=${storeId}`)
      const data = await res.json()

      console.log('APIレスポンス:', data)

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }

      const { categories, products } = data

      // カテゴリーデータを保存
      setProductCategoriesData(categories || [])

      // データ構造を変換
      const productData: ProductCategories = {}

      categories?.forEach((category: ProductCategory) => {
        productData[category.name] = {}

        products?.filter((p: Product) => p.category_id === category.id)
          .forEach((product: Product) => {
            productData[category.name][product.name] = {
              id: product.id,
              price: product.price,
              needsCast: product.needs_cast,
              discountRate: product.discount_rate
            }
          })
      })

      console.log('変換後のデータ:', productData)
      setProductCategories(productData)
    } catch (error) {
      console.error('Error loading products:', error)
      // ログイン前は警告を表示しない
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (isLoggedIn) {
        alert('商品データの読み込みに失敗しました')
      }
    }
  }

  // キャストリスト取得
  const loadCastList = async () => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/casts/list?storeId=${storeId}`)
      const data = await res.json()
      setCastList(data)
    } catch (error) {
      console.error('Error loading cast list:', error)
    }
  }

  // 現在のカテゴリーの推し優先表示設定を取得
  const getCurrentCategoryShowOshiFirst = (selectedCategory: string) => {
    const categoryData = productCategoriesData.find(cat => cat.name === selectedCategory)
    return categoryData?.show_oshi_first || false
  }

  return {
    // State
    productCategories,
    productCategoriesData,
    castList,

    // Functions
    loadProducts,
    loadCastList,
    getCurrentCategoryShowOshiFirst
  }
}
