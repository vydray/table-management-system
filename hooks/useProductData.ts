import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

export interface Product {
  id: number
  name: string
  price: number
  category_id: number
  display_order: number
  is_active: boolean
  needs_cast?: boolean
  discount_rate?: number
  store_id: number
}

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([])

  // 商品を読み込む
  const loadProducts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // 商品を追加
  const addProduct = async (
    name: string,
    price: string,
    categoryId: number,
    needsCast: boolean
  ) => {
    if (!name || !price || !categoryId) return false

    try {
      const storeId = getCurrentStoreId()

      // 同じカテゴリー内で同じ名前の商品が既に存在するかチェック
      const isDuplicate = products.some(p =>
        p.category_id === categoryId &&
        p.name.toLowerCase() === name.toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${name}」は既に登録されています`)
        return false
      }

      const categoryProducts = products.filter(p => p.category_id === categoryId)
      const maxDisplayOrder = categoryProducts.length > 0
        ? Math.max(...categoryProducts.map(p => p.display_order))
        : 0

      const { error } = await supabase
        .from('products')
        .insert({
          name,
          price: parseInt(price),
          category_id: categoryId,
          display_order: maxDisplayOrder + 1,
          is_active: true,
          needs_cast: needsCast,
          store_id: storeId
        })

      if (error) throw error

      await loadProducts()
      return true
    } catch (error) {
      console.error('Error adding product:', error)
      alert('商品の追加に失敗しました')
      return false
    }
  }

  // 商品を更新
  const updateProduct = async (
    productId: number,
    name: string,
    price: string,
    categoryId: number,
    needsCast: boolean
  ) => {
    if (!name || !price || !categoryId) return false

    try {
      const storeId = getCurrentStoreId()

      // 編集中の商品と同じカテゴリー内で、編集中の商品以外に同じ名前が存在するかチェック
      const isDuplicate = products.some(p =>
        p.id !== productId &&
        p.category_id === categoryId &&
        p.name.toLowerCase() === name.toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${name}」は既に登録されています`)
        return false
      }

      const { error } = await supabase
        .from('products')
        .update({
          name,
          price: parseInt(price),
          category_id: categoryId,
          needs_cast: needsCast
        })
        .eq('id', productId)
        .eq('store_id', storeId)

      if (error) throw error

      await loadProducts()
      return true
    } catch (error) {
      console.error('Error updating product:', error)
      alert('商品の更新に失敗しました')
      return false
    }
  }

  // 商品を削除
  const deleteProduct = async (productId: number) => {
    if (!confirm('この商品を削除しますか？')) return false

    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', storeId)

      if (error) throw error

      await loadProducts()
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('商品の削除に失敗しました')
      return false
    }
  }

  // キャスト指名の必要性を切り替え
  const toggleCast = async (productId: number, currentValue: boolean) => {
    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('products')
        .update({ needs_cast: !currentValue })
        .eq('id', productId)
        .eq('store_id', storeId)

      if (error) throw error
      await loadProducts()
      return true
    } catch (error) {
      console.error('Error toggling cast:', error)
      return false
    }
  }

  // アクティブ状態を切り替え
  const toggleActive = async (productId: number, currentValue: boolean) => {
    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentValue })
        .eq('id', productId)
        .eq('store_id', storeId)

      if (error) throw error
      await loadProducts()
      return true
    } catch (error) {
      console.error('Error toggling active:', error)
      return false
    }
  }

  return {
    products,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleCast,
    toggleActive
  }
}
