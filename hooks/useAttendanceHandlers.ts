import { useEffect } from 'react'

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

export const useAttendanceHandlers = (
  attendanceRows: AttendanceRow[],
  setAttendanceRows: React.Dispatch<React.SetStateAction<AttendanceRow[]>>,
  setShowDropdowns: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  addRowHelper: (rows: AttendanceRow[], setRows: React.Dispatch<React.SetStateAction<AttendanceRow[]>>) => void,
  updateRowHelper: (index: number, field: keyof AttendanceRow, value: string | number | null, rows: AttendanceRow[], setRows: React.Dispatch<React.SetStateAction<AttendanceRow[]>>) => void,
  selectCastHelper: (index: number, castName: string, id: string, rows: AttendanceRow[], setRows: React.Dispatch<React.SetStateAction<AttendanceRow[]>>) => void,
  deleteRowFromDB: (index: number, date: string) => Promise<void>,
  saveAttendance: (date: string) => Promise<void>,
  selectedDate: string
) => {
  // 行追加ハンドラー
  const addRow = () => {
    addRowHelper(attendanceRows, setAttendanceRows)
  }

  // 行削除ハンドラー
  const deleteRow = async (index: number) => {
    await deleteRowFromDB(index, selectedDate)
  }

  // 行更新ハンドラー（金額フォーマット対応）
  const updateRow = (index: number, field: keyof AttendanceRow, value: string | number | null) => {
    // 日払い金額の場合は数値変換
    if (field === 'daily_payment') {
      const numericValue = parseInt((value?.toString() || '').replace(/[^\d]/g, '') || '0')
      updateRowHelper(index, field, numericValue, attendanceRows, setAttendanceRows)
    } else {
      updateRowHelper(index, field, value, attendanceRows, setAttendanceRows)
    }
  }

  // キャスト選択ハンドラー
  const selectCast = (index: number, castName: string) => {
    // 空の選択の場合はそのまま許可
    if (!castName) {
      updateRow(index, 'cast_name', castName)
      return
    }

    // 同じ名前が既に選択されているかチェック
    const isDuplicate = attendanceRows.some((row, i) =>
      i !== index && row.cast_name === castName
    )

    if (isDuplicate) {
      alert(`${castName}さんは既に選択されています`)
      return
    }

    selectCastHelper(index, castName, attendanceRows[index].id, attendanceRows, setAttendanceRows)
  }

  // 金額をフォーマット（¥とカンマ付き）
  const formatCurrency = (value: number): string => {
    if (!value) return ''
    return `¥${value.toLocaleString()}`
  }

  // 金額入力をハンドル
  const handleCurrencyInput = (index: number, value: string) => {
    // ¥とカンマを除去して数値のみ抽出
    const numericValue = value.replace(/[¥,]/g, '')
    updateRow(index, 'daily_payment', numericValue)
  }

  // 保存ハンドラー
  const handleSave = async () => {
    await saveAttendance(selectedDate)
  }

  // 時間の選択肢を生成（10:00〜33:30 = 9:30まで）
  const generateTimeOptions = () => {
    const options = ['']
    for (let hour = 10; hour <= 33; hour++) {
      const displayHour = hour > 24 ? hour - 24 : hour
      for (const minute of ['00', '30']) {
        options.push(`${displayHour.toString().padStart(2, '0')}:${minute}`)
      }
    }
    return options
  }

  // クリックイベントの処理（ドロップダウンを閉じる）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.cast-name-container')) {
        setShowDropdowns({})
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    addRow,
    deleteRow,
    updateRow,
    selectCast,
    formatCurrency,
    handleCurrencyInput,
    handleSave,
    timeOptions: generateTimeOptions()
  }
}
