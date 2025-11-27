import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

// getCurrentStoreIdの結果を数値に変換するヘルパー関数
const getStoreIdAsNumber = (): number => {
  const storeId = getCurrentStoreId()

  let numericId: number
  if (typeof storeId === 'string') {
    numericId = parseInt(storeId)
  } else if (typeof storeId === 'number') {
    numericId = storeId
  } else {
    console.error('Invalid store ID type:', typeof storeId, storeId)
    numericId = 1
  }

  if (isNaN(numericId) || numericId <= 0) {
    console.error('Invalid store ID:', storeId)
    return 1
  }

  return numericId
}

// キャストの型定義
export interface Cast {
  id: number
  store_id: number
  name: string | null
  line_number: string | null
  twitter: string | null
  password: string | null
  instagram: string | null
  password2: string | null
  photo: string | null
  attributes: string | null
  is_writer: boolean | null
  submission_date: string | null
  back_number: string | null
  status: string | null
  sales_previous_day: string | null
  cast_point: number | null
  show_in_pos: boolean | null
  birthday: string | null
  created_at: string | null
  updated_at: string | null
  resignation_date: string | null
  attendance_certificate: boolean | null
  residence_record: boolean | null
  contract_documents: boolean | null
  submission_contract: string | null
  employee_name: string | null
  experience_date: string | null
  hire_date: string | null
}

export const useCastData = () => {
  const [casts, setCasts] = useState<Cast[]>([])

  // キャスト一覧を読み込む
  const loadCasts = async () => {
    try {
      const storeId = getStoreIdAsNumber()

      if (!storeId || storeId === 0) {
        console.error('Invalid store_id, cannot load casts')
        return
      }

      const { data, error } = await supabase
        .from('casts')
        .select('*')
        .eq('store_id', storeId)
        .order('id')

      if (error) {
        console.error('Failed to load casts:', error)
        throw error
      }

      setCasts(data || [])
    } catch (error) {
      console.error('Failed to load casts:', error)
    }
  }

  // 新規キャスト追加
  const addNewCast = async (editingCast: Cast) => {
    try {
      // 既に同じ名前のキャストが存在するかチェック
      const isDuplicate = casts.some(c =>
        c.name &&
        c.name.toLowerCase() === (editingCast.name || '').toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${editingCast.name}」は既に登録されています`)
        return false
      }

      const storeId = getStoreIdAsNumber()

      if (!storeId || storeId === 0) {
        alert('店舗情報が取得できません。ページを再読み込みしてください。')
        return false
      }

      // 必須フィールドを含む新規キャストデータ
      const newCast = {
        name: editingCast.name || '新規キャスト',
        store_id: storeId,
        status: editingCast.status || '体験',
        show_in_pos: editingCast.show_in_pos ?? false,
        attributes: editingCast.attributes || null,
        twitter: editingCast.twitter || null,
        instagram: editingCast.instagram || null,
        birthday: editingCast.birthday || null,
        experience_date: editingCast.experience_date || null,
        hire_date: editingCast.hire_date || null
      }

      const { error } = await supabase
        .from('casts')
        .insert(newCast)

      if (error) throw error

      alert('キャストを追加しました')
      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to add cast:', error)
      alert('追加に失敗しました')
      return false
    }
  }

  // キャスト更新
  const updateCast = async (editingCast: Cast) => {
    try {
      // 編集中のキャスト以外に同じ名前が存在するかチェック
      const isDuplicate = casts.some(c =>
        c.id !== editingCast.id &&
        c.name &&
        c.name.toLowerCase() === (editingCast.name || '').toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${editingCast.name}」は既に登録されています`)
        return false
      }

      const storeId = getStoreIdAsNumber()

      const updateData: Record<string, unknown> = {
        name: editingCast.name || '',
        twitter: editingCast.twitter || '',
        instagram: editingCast.instagram || '',
        attributes: editingCast.attributes || '',
        status: editingCast.status || '',
        show_in_pos: editingCast.show_in_pos ?? true,
        birthday: editingCast.birthday || null,
        resignation_date: editingCast.resignation_date,
        attendance_certificate: editingCast.attendance_certificate || false,
        residence_record: editingCast.residence_record || false,
        contract_documents: editingCast.contract_documents || false,
        submission_contract: editingCast.submission_contract || '',
        employee_name: editingCast.employee_name || '',
        experience_date: editingCast.experience_date || null,
        hire_date: editingCast.hire_date || null,
        sales_previous_day: editingCast.sales_previous_day || '無',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('casts')
        .update(updateData)
        .eq('id', editingCast.id)
        .eq('store_id', storeId)

      if (error) throw error

      alert('キャスト情報を更新しました')
      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to update cast:', error)
      alert('更新に失敗しました')
      return false
    }
  }

  // キャスト削除
  const deleteCast = async (cast: Cast) => {
    if (!confirm(`${cast.name}さんを削除しますか？`)) return false

    try {
      const storeId = getStoreIdAsNumber()
      const { error } = await supabase
        .from('casts')
        .delete()
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) throw error

      alert('キャストを削除しました')
      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to delete cast:', error)
      alert('削除に失敗しました')
      return false
    }
  }

  // キャストの役職を更新
  const updateCastPosition = async (cast: Cast, newPosition: string) => {
    try {
      const storeId = getStoreIdAsNumber()
      const { error } = await supabase
        .from('casts')
        .update({
          attributes: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) throw error

      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to update cast position:', error)
      alert('役職の更新に失敗しました')
      return false
    }
  }

  // キャストのステータスを更新
  const updateCastStatus = async (cast: Cast, newStatus: string) => {
    try {
      const storeId = getStoreIdAsNumber()
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === '体験') {
        updateData.experience_date = new Date().toISOString().split('T')[0]
      } else if (newStatus === '在籍') {
        updateData.hire_date = new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('casts')
        .update(updateData)
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) throw error

      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to update cast status:', error)
      alert('ステータスの更新に失敗しました')
      return false
    }
  }

  // キャストの退店処理
  const retireCast = async (cast: Cast, resignationDate: string) => {
    try {
      const storeId = getStoreIdAsNumber()
      const { error } = await supabase
        .from('casts')
        .update({
          status: '退店',
          resignation_date: resignationDate,
          show_in_pos: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) throw error

      alert(`${cast.name}さんを退店処理しました`)
      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to retire cast:', error)
      alert('退店処理に失敗しました')
      return false
    }
  }

  // POS表示切り替え
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getStoreIdAsNumber()
      const { error } = await supabase
        .from('casts')
        .update({
          show_in_pos: !cast.show_in_pos,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) throw error

      await loadCasts()
      return true
    } catch (error) {
      console.error('Failed to toggle show_in_pos:', error)
      alert('POS表示の切り替えに失敗しました')
      return false
    }
  }

  return {
    casts,
    setCasts,
    loadCasts,
    addNewCast,
    updateCast,
    deleteCast,
    updateCastPosition,
    updateCastStatus,
    retireCast,
    toggleCastShowInPos
  }
}
