import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

// 役職の型定義
export interface Position {
  id: number
  store_id: number
  name: string
  display_order: number
  is_active: boolean
}

export const usePositionData = () => {
  const [positions, setPositions] = useState<Position[]>([])

  // 役職一覧を読み込む
  const loadPositions = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('cast_positions')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setPositions(data || [])
    } catch (error) {
      console.error('Failed to load positions:', error)
    }
  }

  // 役職を追加
  const addPosition = async (newPositionName: string) => {
    if (!newPositionName.trim()) return false

    try {
      const storeId = getCurrentStoreId()
      const maxOrder = Math.max(...positions.map(p => p.display_order), 0)

      const { error } = await supabase
        .from('cast_positions')
        .insert({
          store_id: storeId,
          name: newPositionName,
          display_order: maxOrder + 10,
          is_active: true
        })

      if (error) throw error

      await loadPositions()
      alert('役職を追加しました')
      return true
    } catch (error) {
      console.error('Failed to add position:', error)
      alert('役職の追加に失敗しました')
      return false
    }
  }

  // 役職を削除（非アクティブ化）
  const deletePosition = async (id: number) => {
    if (!confirm('この役職を削除しますか？')) return false

    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('cast_positions')
        .update({ is_active: false })
        .eq('id', id)
        .eq('store_id', storeId)

      if (error) throw error

      await loadPositions()
      alert('役職を削除しました')
      return true
    } catch (error) {
      console.error('Failed to delete position:', error)
      alert('役職の削除に失敗しました')
      return false
    }
  }

  return {
    positions,
    loadPositions,
    addPosition,
    deletePosition
  }
}
