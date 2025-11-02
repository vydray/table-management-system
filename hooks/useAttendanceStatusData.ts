import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface AttendanceStatusItem {
  id: string
  store_id: string
  name: string
  color: string
  is_active: boolean
  order_index: number
}

export const useAttendanceStatusData = () => {
  const [attendanceStatuses, setAttendanceStatuses] = useState<AttendanceStatusItem[]>([])

  // デフォルトステータスを作成
  const createDefaultStatuses = async () => {
    const storeId = getCurrentStoreId()
    const defaultStatuses = [
      { name: '出勤', color: '#4CAF50', is_active: true, order_index: 0 },
      { name: '遅刻', color: '#FF9800', is_active: false, order_index: 1 },
      { name: '早退', color: '#2196F3', is_active: false, order_index: 2 },
      { name: '欠勤', color: '#F44336', is_active: false, order_index: 3 },
      { name: '有給', color: '#9C27B0', is_active: false, order_index: 4 }
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
    statuses: AttendanceStatusItem[]
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

      const storeId = getCurrentStoreId()
      console.log('Adding status with store_id:', storeId)

      const { error } = await supabase
        .from('attendance_statuses')
        .insert({
          name: statusName.trim(),
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
    statuses: AttendanceStatusItem[]
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

      const { error } = await supabase
        .from('attendance_statuses')
        .update({
          name: statusName.trim(),
          color: statusColor
        })
        .eq('id', statusId)

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
      const { error } = await supabase
        .from('attendance_statuses')
        .update({ is_active: !currentActive })
        .eq('id', statusId)

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
      const { error } = await supabase
        .from('attendance_statuses')
        .delete()
        .eq('id', statusId)

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
