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
}

export const useProductCategory = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

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

  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    loadCategories
  }
}
