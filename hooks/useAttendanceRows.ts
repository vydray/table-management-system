import { useState } from 'react'

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

export const useAttendanceRows = () => {
  const [showDropdowns, setShowDropdowns] = useState<{[key: string]: boolean}>({})

  // 行を追加
  const addRow = (
    attendanceRows: AttendanceRow[],
    setAttendanceRows: (rows: AttendanceRow[]) => void
  ) => {
    setAttendanceRows([...attendanceRows, {
      id: `new-${Date.now()}`,
      cast_name: '',
      check_in_time: '',
      check_out_time: '',
      status: '未設定',
      late_minutes: 0,
      break_minutes: 0,
      daily_payment: 0
    }])
  }

  // 行の値を更新
  const updateRow = (
    index: number,
    field: keyof AttendanceRow,
    value: string | number,
    attendanceRows: AttendanceRow[],
    setAttendanceRows: (rows: AttendanceRow[]) => void
  ) => {
    const newRows = [...attendanceRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setAttendanceRows(newRows)
  }

  // ドロップダウンの表示切り替え
  const toggleDropdown = (rowId: string) => {
    setShowDropdowns(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  // ドロップダウンを閉じる
  const closeDropdown = (rowId: string) => {
    setShowDropdowns(prev => ({
      ...prev,
      [rowId]: false
    }))
  }

  // キャストを選択
  const selectCast = (
    index: number,
    castName: string,
    rowId: string,
    attendanceRows: AttendanceRow[],
    setAttendanceRows: (rows: AttendanceRow[]) => void
  ) => {
    updateRow(index, 'cast_name', castName, attendanceRows, setAttendanceRows)
    closeDropdown(rowId)
  }

  return {
    // State
    showDropdowns,
    setShowDropdowns,

    // Functions
    addRow,
    updateRow,
    toggleDropdown,
    closeDropdown,
    selectCast
  }
}
