import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Category {
  id: number
  name: string
  display_order: number
  store_id: number
  created_at?: string
  show_oshi_first?: boolean
}

export const useCategoryData = () => {
  const [categories, setCategories] = useState<Category[]>([])

  // カテゴリーを読み込む
  const loadCategories = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // カテゴリーを追加
  const addCategory = async (categoryName: string, existingCategories: Category[]): Promise<boolean> => {
    if (!categoryName) return false

    try {
      // 既に同じ名前のカテゴリーが存在するかチェック
      const isDuplicate = existingCategories.some(c =>
        c.name.toLowerCase() === categoryName.toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${categoryName}」は既に登録されています`)
        return false
      }

      const storeId = getCurrentStoreId()
      const maxDisplayOrder = existingCategories.length > 0
        ? Math.max(...existingCategories.map(c => c.display_order))
        : 0

      const { error } = await supabase
        .from('product_categories')
        .insert({
          name: categoryName,
          display_order: maxDisplayOrder + 1,
          store_id: storeId,
          show_oshi_first: false
        })

      if (error) throw error

      await loadCategories()
      return true
    } catch (error) {
      console.error('Error adding category:', error)
      alert('カテゴリーの追加に失敗しました')
      return false
    }
  }

  // カテゴリーを更新
  const updateCategory = async (
    categoryId: number,
    categoryName: string,
    existingCategories: Category[]
  ): Promise<boolean> => {
    if (!categoryName) return false

    try {
      // 編集中のカテゴリー以外に同じ名前が存在するかチェック
      const isDuplicate = existingCategories.some(c =>
        c.id !== categoryId &&
        c.name.toLowerCase() === categoryName.toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${categoryName}」は既に登録されています`)
        return false
      }

      const { error } = await supabase
        .from('product_categories')
        .update({ name: categoryName })
        .eq('id', categoryId)

      if (error) throw error

      await loadCategories()
      return true
    } catch (error) {
      console.error('Error updating category:', error)
      alert('カテゴリーの更新に失敗しました')
      return false
    }
  }

  // カテゴリーを削除
  const deleteCategory = async (categoryId: number): Promise<boolean> => {
    if (!confirm('このカテゴリーを削除しますか？\n※このカテゴリーに属する商品も全て削除されます')) {
      return false
    }

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      await loadCategories()
      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('カテゴリーの削除に失敗しました')
      return false
    }
  }

  // 推し優先表示を切り替え
  const toggleOshiFirst = async (categoryId: number, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ show_oshi_first: !currentValue })
        .eq('id', categoryId)

      if (error) throw error
      await loadCategories()
    } catch (error) {
      console.error('Error toggling oshi first:', error)
    }
  }

  return {
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleOshiFirst
  }
}
