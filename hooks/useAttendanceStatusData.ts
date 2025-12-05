import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

export interface AttendanceStatusItem {
  id: string
  store_id: string
  name: string  // ステータス表示名
  code: string | null  // プログラムから参照するためのコード（例: 'present', 'late', 'absent'）
  color: string
  is_active: boolean
  order_index: number  // 表示順序
}

export const useAttendanceStatusData = () => {
  const [attendanceStatuses, setAttendanceStatuses] = useState<AttendanceStatusItem[]>([])

  // デフォルトステータスを作成（LINE_BOT_DESIGN.mdの8種類に対応）
  const createDefaultStatuses = async () => {
    const storeId = getCurrentStoreId()
    const defaultStatuses = [
      { name: '出勤', code: 'present', color: '#22c55e', is_active: true, order_index: 0 },
      { name: '当欠', code: 'same_day_absence', color: '#ef4444', is_active: false, order_index: 1 },
      { name: '事前欠勤', code: 'advance_absence', color: '#f97316', is_active: false, order_index: 2 },
      { name: '無欠', code: 'no_call_no_show', color: '#dc2626', is_active: false, order_index: 3 },
      { name: '遅刻', code: 'late', color: '#eab308', is_active: false, order_index: 4 },
      { name: '早退', code: 'early_leave', color: '#a855f7', is_active: false, order_index: 5 },
      { name: '公欠', code: 'excused', color: '#3b82f6', is_active: false, order_index: 6 },
      { name: 'リクエスト出勤', code: 'request_shift', color: '#06b6d4', is_active: false, order_index: 7 }
    ]

    const statusesToInsert = defaultStatuses.map(status => ({
      ...status,
      store_id: storeId
    }))

    const { error } = await supabase
      .from('attendance_statuses')
      .insert(statusesToInsert)

    if (!error) {
      loadAttendanceStatuses()
    }
  }

  // 勤怠ステータスを読み込む
  const loadAttendanceStatuses = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('attendance_statuses')
        .select('*')
        .eq('store_id', storeId)
        .order('order_index')

      if (error) {
        // テーブルが存在しない場合はデフォルトステータスを作成
        if (error.code === '42P01') {
          await createDefaultStatuses()
          return
        }
        throw error
      }

      if (!data || data.length === 0) {
        await createDefaultStatuses()
      } else {
        setAttendanceStatuses(data)
      }
    } catch (error) {
      console.error('Error loading attendance statuses:', error)
    }
  }

  // 勤怠ステータスを追加
  const addAttendanceStatus = async (
    statusName: string,
    statusColor: string,
    statuses: AttendanceStatusItem[],
    statusCode?: string
  ): Promise<boolean> => {
    if (!statusName.trim()) {
      alert('ステータス名を入力してください')
      return false
    }

    try {
      // 既に同じ名前のステータスが存在するかチェック
      const isDuplicate = statuses.some(s =>
        s.name.toLowerCase() === statusName.trim().toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${statusName.trim()}」は既に登録されています`)
        return false
      }

      // codeが指定されている場合、重複チェック
      if (statusCode) {
        const codeExists = statuses.some(s => s.code === statusCode)
        if (codeExists) {
          alert(`コード「${statusCode}」は既に使用されています`)
          return false
        }
      }

      const storeId = getCurrentStoreId()

      const { error } = await supabase
        .from('attendance_statuses')
        .insert({
          name: statusName.trim(),
          code: statusCode || null,
          color: statusColor,
          is_active: false,
          order_index: statuses.length,
          store_id: storeId
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      await loadAttendanceStatuses()
      await updateActiveStatusesInSettings()
      return true
    } catch (error) {
      console.error('Error adding status:', error)
      if (error instanceof Error) {
        alert(`ステータスの追加に失敗しました: ${error.message}`)
      } else {
        alert('ステータスの追加に失敗しました')
      }
      return false
    }
  }

  // ステータスを更新
  const updateStatus = async (
    statusId: string,
    statusName: string,
    statusColor: string,
    statuses: AttendanceStatusItem[],
    statusCode?: string
  ): Promise<boolean> => {
    if (!statusName.trim()) {
      alert('ステータス名を入力してください')
      return false
    }

    try {
      // 編集中のステータス以外に同じ名前が存在するかチェック
      const isDuplicate = statuses.some(s =>
        s.id !== statusId &&
        s.name.toLowerCase() === statusName.trim().toLowerCase()
      )

      if (isDuplicate) {
        alert(`「${statusName.trim()}」は既に登録されています`)
        return false
      }

      // codeが指定されている場合、編集中以外で重複チェック
      if (statusCode) {
        const codeExists = statuses.some(s => s.id !== statusId && s.code === statusCode)
        if (codeExists) {
          alert(`コード「${statusCode}」は既に使用されています`)
          return false
        }
      }

      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('attendance_statuses')
        .update({
          name: statusName.trim(),
          code: statusCode !== undefined ? (statusCode || null) : undefined,
          color: statusColor
        })
        .eq('id', statusId)
        .eq('store_id', storeId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      await loadAttendanceStatuses()
      await updateActiveStatusesInSettings()
      return true
    } catch (error) {
      console.error('Error updating status:', error)
      if (error instanceof Error) {
        alert(`ステータスの更新に失敗しました: ${error.message}`)
      } else {
        alert('ステータスの更新に失敗しました')
      }
      return false
    }
  }

  // ステータスの有効/無効を切り替え
  const toggleStatusActive = async (statusId: string, currentActive: boolean) => {
    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('attendance_statuses')
        .update({ is_active: !currentActive })
        .eq('id', statusId)
        .eq('store_id', storeId)

      if (error) throw error

      loadAttendanceStatuses()
      updateActiveStatusesInSettings()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  // ステータスを削除
  const deleteStatus = async (statusId: string): Promise<boolean> => {
    if (!confirm('このステータスを削除しますか?')) return false

    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('attendance_statuses')
        .delete()
        .eq('id', statusId)
        .eq('store_id', storeId)

      if (error) throw error

      loadAttendanceStatuses()
      updateActiveStatusesInSettings()
      return true
    } catch (error) {
      console.error('Error deleting status:', error)
      alert('ステータスの削除に失敗しました')
      return false
    }
  }

  // system_settingsのactive_attendance_statusesを更新
  const updateActiveStatusesInSettings = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('attendance_statuses')
        .select('name')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('order_index')

      if (data) {
        const activeStatuses = data.map(s => s.name)

        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: 'active_attendance_statuses',
            setting_value: JSON.stringify(activeStatuses),
            store_id: storeId
          })

        if (error) {
          console.error('Error upserting system_settings:', error)
        }
      }
    } catch (error) {
      console.error('Error updating active statuses in settings:', error)
    }
  }

  return {
    attendanceStatuses,
    loadAttendanceStatuses,
    addAttendanceStatus,
    updateStatus,
    toggleStatusActive,
    deleteStatus
  }
}
