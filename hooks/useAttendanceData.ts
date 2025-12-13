import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

interface AttendanceRow {
  id: string
  cast_name: string
  check_in_time: string
  check_out_time: string
  status: string
  late_minutes: number
  break_minutes: number
  daily_payment: number
  costume_id: number | null
}

interface Cast {
  id: number
  name: string
  status?: string
}

interface Costume {
  id: number
  name: string
}

export const useAttendanceData = () => {
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])
  const [casts, setCasts] = useState<Cast[]>([])
  const [costumes, setCostumes] = useState<Costume[]>([])
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
        daily_payment: 0,
        costume_id: null
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

  // 衣装一覧を取得
  const loadCostumes = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('costumes')
        .select('id, name')
        .eq('store_id', storeId)
        .order('name')

      if (error) throw error
      setCostumes(data || [])
    } catch (error) {
      console.error('Error loading costumes:', error)
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
          daily_payment: item.daily_payment,
          costume_id: item.costume_id || null
        }))

        // 既存データ + 空行で5行になるように調整
        const emptyRowsCount = Math.max(5 - formattedData.length, 0)
        const emptyRows: AttendanceRow[] = []
        for (let i = 0; i < emptyRowsCount; i++) {
          emptyRows.push({
            id: `new-${Date.now()}-${i}`,
            cast_name: '',
            check_in_time: '',
            check_out_time: '',
            status: '未設定',
            late_minutes: 0,
            break_minutes: 0,
            daily_payment: 0,
            costume_id: null
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
          costume_id: row.costume_id,
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

  // 当日シフトから一括登録
  const bulkRegisterFromShifts = async (selectedDate: string) => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()

      // 1. 当日のシフトを取得（cast_idとcastsテーブルをjoin）
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          cast_id,
          start_time,
          end_time,
          casts!inner(name)
        `)
        .eq('store_id', storeId)
        .eq('date', selectedDate)

      if (shiftsError) throw shiftsError

      if (!shifts || shifts.length === 0) {
        alert('本日のシフトデータがありません')
        return
      }

      // 2. 既存の勤怠データを取得
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('cast_name')
        .eq('store_id', storeId)
        .eq('date', selectedDate)

      if (attendanceError) throw attendanceError

      // 3. 既存の勤怠がある人を除外（cast_nameで比較）
      const existingCastNames = new Set(existingAttendance?.map(a => a.cast_name) || [])
      const newShifts = shifts.filter(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const castData = s.casts as any
        const castName = castData?.name as string | undefined
        return castName && !existingCastNames.has(castName)
      })

      if (newShifts.length === 0) {
        alert('登録済みでないシフトがありません')
        return
      }

      // 4. attendance_statusesからcode='present'のステータス名を取得
      const { data: presentStatus } = await supabase
        .from('attendance_statuses')
        .select('name')
        .eq('store_id', storeId)
        .eq('code', 'present')
        .single()

      const statusName = presentStatus?.name || '出勤'

      // 5. 新しい勤怠データを追加
      const newRows: AttendanceRow[] = newShifts.map((shift, i) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const castData = shift.casts as any
        return {
          id: `new-bulk-${Date.now()}-${i}`,
          cast_name: (castData?.name as string) || '',
          check_in_time: shift.start_time ? shift.start_time.slice(0, 5) : '',
          check_out_time: '',
          status: statusName,
          late_minutes: 0,
          break_minutes: 0,
          daily_payment: 0,
          costume_id: null
        }
      })

      // 既存の空でない行 + 新しい行
      const existingValidRows = attendanceRows.filter(row => row.cast_name)
      const emptyRowsNeeded = Math.max(0, 5 - existingValidRows.length - newRows.length)
      const emptyRows: AttendanceRow[] = []
      for (let i = 0; i < emptyRowsNeeded; i++) {
        emptyRows.push({
          id: `new-empty-${Date.now()}-${i}`,
          cast_name: '',
          check_in_time: '',
          check_out_time: '',
          status: '未設定',
          late_minutes: 0,
          break_minutes: 0,
          daily_payment: 0,
          costume_id: null
        })
      }

      setAttendanceRows([...existingValidRows, ...newRows, ...emptyRows])
      alert(`${newRows.length}人のシフトを追加しました（保存ボタンで確定）`)
    } catch (error) {
      console.error('Error bulk registering:', error)
      alert('一括登録に失敗しました')
    } finally {
      setLoading(false)
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
    costumes,
    loading,
    saving,

    // Functions
    loadCasts,
    loadCostumes,
    loadAttendance,
    saveAttendance,
    deleteRow,
    initializeRows,
    bulkRegisterFromShifts
  }
}
