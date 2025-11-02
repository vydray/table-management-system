import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AttendanceRow {
  id: string
  cast_name: string
  check_in_time: string
  check_out_time: string
  status: string
  late_minutes: number
  break_minutes: number
  daily_payment: number
}

interface Cast {
  id: number
  name: string
  status?: string
}

export const useAttendanceData = () => {
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])
  const [casts, setCasts] = useState<Cast[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 初期行を作成
  const initializeRows = () => {
    const rows: AttendanceRow[] = []
    for (let i = 0; i < 5; i++) {
      rows.push({
        id: `new-${Date.now()}-${i}`,
        cast_name: '',
        check_in_time: '',
        check_out_time: '',
        status: '未設定',
        late_minutes: 0,
        break_minutes: 0,
        daily_payment: 0
      })
    }
    return rows
  }

  // キャスト一覧を取得
  const loadCasts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('casts')
        .select('id, name, status')
        .eq('store_id', storeId)
        .in('status', ['在籍', '体験'])
        .order('name')

      if (error) throw error
      setCasts(data || [])
    } catch (error) {
      console.error('Error loading casts:', error)
    }
  }

  // 勤怠データを読み込む
  const loadAttendance = async (selectedDate: string) => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('store_id', storeId)
        .eq('date', selectedDate)
        .order('cast_name')

      if (error) throw error

      if (data && data.length > 0) {
        // 既存データをフォーマット
        const formattedData = data.map(item => ({
          id: item.id.toString(),
          cast_name: item.cast_name,
          check_in_time: item.check_in_datetime ? new Date(item.check_in_datetime).toTimeString().slice(0, 5) : '',
          check_out_time: item.check_out_datetime ? new Date(item.check_out_datetime).toTimeString().slice(0, 5) : '',
          status: item.status,
          late_minutes: item.late_minutes,
          break_minutes: item.break_minutes,
          daily_payment: item.daily_payment
        }))

        // 既存データ + 空行で5行になるように調整
        const emptyRowsCount = Math.max(5 - formattedData.length, 0)
        const emptyRows = []
        for (let i = 0; i < emptyRowsCount; i++) {
          emptyRows.push({
            id: `new-${Date.now()}-${i}`,
            cast_name: '',
            check_in_time: '',
            check_out_time: '',
            status: '未設定',
            late_minutes: 0,
            break_minutes: 0,
            daily_payment: 0
          })
        }

        setAttendanceRows([...formattedData, ...emptyRows])
      } else {
        // データがない場合は初期行を表示
        setAttendanceRows(initializeRows())
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      setAttendanceRows(initializeRows())
    } finally {
      setLoading(false)
    }
  }

  // 勤怠データを保存
  const saveAttendance = async (selectedDate: string) => {
    setSaving(true)
    try {
      const storeId = getCurrentStoreId()

      // 空でない行のみを抽出
      const validRows = attendanceRows.filter(row => row.cast_name && row.check_in_time)

      // 既存データを削除
      await supabase
        .from('attendance')
        .delete()
        .eq('store_id', storeId)
        .eq('date', selectedDate)

      // 新しいデータを挿入
      if (validRows.length > 0) {
        const insertData = validRows.map(row => ({
          store_id: storeId,
          date: selectedDate,
          cast_name: row.cast_name,
          check_in_datetime: selectedDate + 'T' + row.check_in_time + ':00',
          check_out_datetime: row.check_out_time ? selectedDate + 'T' + row.check_out_time + ':00' : null,
          status: row.status,
          late_minutes: row.late_minutes || 0,
          break_minutes: row.break_minutes || 0,
          daily_payment: row.daily_payment || 0,
          role: 'cast'
        }))

        const { error } = await supabase
          .from('attendance')
          .insert(insertData)

        if (error) throw error
      }

      alert('勤怠データを保存しました')
      await loadAttendance(selectedDate)
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 行を削除
  const deleteRow = async (index: number, selectedDate: string) => {
    const row = attendanceRows[index]

    if (!row.id.startsWith('new-')) {
      // DBに存在する行の場合は削除確認
      if (!confirm(`${row.cast_name}さんの勤怠データを削除しますか？`)) {
        return
      }

      try {
        const storeId = getCurrentStoreId()
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('id', row.id)
          .eq('store_id', storeId)

        if (error) throw error
        await loadAttendance(selectedDate)
      } catch (error) {
        console.error('Error deleting row:', error)
        alert('削除に失敗しました')
      }
    } else {
      // 新規行の場合は単に配列から削除
      setAttendanceRows(attendanceRows.filter((_, i) => i !== index))
    }
  }

  return {
    // State
    attendanceRows,
    setAttendanceRows,
    casts,
    loading,
    saving,

    // Functions
    loadCasts,
    loadAttendance,
    saveAttendance,
    deleteRow,
    initializeRows
  }
}
