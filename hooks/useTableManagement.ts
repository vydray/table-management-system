import { useState, useRef, useCallback } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { TableData } from '../types'
import { getCurrentStoreId } from '../utils/storeContext'

// SWR用フェッチャー
const fetcher = (url: string) => fetch(url).then(res => res.json())

// テーブルの位置情報（元の固定位置）
const tablePositions = {
  'A1': { top: 650, left: 900 },
  'A2': { top: 650, left: 1050 },
  'A3': { top: 520, left: 1050 },
  'A4': { top: 390, left: 1050 },
  'A5': { top: 260, left: 1050 },
  'A6': { top: 260, left: 900 },
  'A7': { top: 260, left: 750 },
  'B1': { top: 100, left: 1050 },
  'B2': { top: 100, left: 880 },
  'B3': { top: 100, left: 710 },
  'B4': { top: 100, left: 540 },
  'B5': { top: 100, left: 370 },
  'B6': { top: 100, left: 200 },
  'C1': { top: 260, left: 320 },
  'C2': { top: 260, left: 100 },
  'C3': { top: 390, left: 100 },
  'C4': { top: 520, left: 100 },
  'C5': { top: 650, left: 100 },
  '臨時1': { top: 460, left: 490 },
  '臨時2': { top: 460, left: 660 }
}

// レイアウト型定義
interface TableLayout {
  table_name: string
  display_name: string | null
  position_top: number
  position_left: number
  table_width: number
  table_height: number
  is_visible: boolean
  page_number: number
}

// テーブルデータを処理する関数
const processTableData = (layouts: TableLayout[], tableData: TableData[]): Record<string, TableData> => {
  const tableMap: Record<string, TableData> = {}

  // レイアウトから空のテーブルマップを初期化
  layouts.filter(t => t.is_visible).forEach(layout => {
    tableMap[layout.table_name] = {
      table: layout.table_name,
      name: '',
      oshi: [],
      time: '',
      visit: '',
      elapsed: '',
      status: 'empty'
    }
  })

  // ステータスデータで更新
  tableData.forEach((item: TableData) => {
    if (!(item.table in tableMap)) return

    if (item.time && item.status === 'occupied') {
      const entryTime = new Date(item.time.replace(' ', 'T'))
      const now = new Date()
      let elapsedMin = Math.floor((now.getTime() - entryTime.getTime()) / 60000)
      if (elapsedMin < 0) elapsedMin = 0

      let elapsedText = ''
      if (elapsedMin >= 1440) {
        const days = Math.floor(elapsedMin / 1440)
        const hours = Math.floor((elapsedMin % 1440) / 60)
        const mins = elapsedMin % 60
        elapsedText = `${days}日${hours}時間${mins}分`
      } else if (elapsedMin >= 60) {
        const hours = Math.floor(elapsedMin / 60)
        const mins = elapsedMin % 60
        elapsedText = `${hours}時間${mins}分`
      } else {
        elapsedText = `${elapsedMin}分`
      }

      tableMap[item.table] = { ...item, elapsed: elapsedText }
    } else {
      tableMap[item.table] = item
    }
  })

  return tableMap
}

export const useTableManagement = () => {
  const [currentTable, setCurrentTable] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [moveMode, setMoveMode] = useState(false)
  const [moveFromTable, setMoveFromTable] = useState('')
  const [showMoveHint, setShowMoveHint] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [attendingCastCount, setAttendingCastCount] = useState(0)

  const isLongPress = useRef(false)
  const storeId = getCurrentStoreId()

  // SWRでテーブルデータを取得（キャッシュ有効）
  const { data: combinedData, mutate: mutateTableData } = useSWR<{
    layouts: TableLayout[]
    tableData: TableData[]
  }>(
    storeId ? `/api/tables/combined?storeId=${storeId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,      // タブ復帰時に再取得
      dedupingInterval: 2000,       // 2秒間は重複リクエスト防止
    }
  )

  // 取得したデータを処理
  const tableLayouts: TableLayout[] = combinedData?.layouts || []
  const tables: Record<string, TableData> = combinedData?.layouts && combinedData?.tableData
    ? processTableData(combinedData.layouts, combinedData.tableData)
    : {}

  // 最大ページ番号
  const maxPageNumber = tableLayouts.length > 0
    ? Math.max(...tableLayouts.map(t => t.page_number || 1), 1)
    : 1

  // 使用中テーブル数
  const occupiedTableCount = Object.values(tables).filter(table => table.status !== 'empty').length

  // データ再取得（SWRのmutateを呼ぶ）- 互換性のため維持
  const loadData = useCallback(async () => {
    await mutateTableData()
  }, [mutateTableData])

  // テーブルレイアウト再取得（SWRのmutateを呼ぶ）- 互換性のため維持
  const loadTableLayouts = useCallback(async () => {
    await mutateTableData()
  }, [mutateTableData])

  // 出勤中のキャスト数を取得する関数
  const loadAttendingCastCount = async () => {
    try {
      const storeId = getCurrentStoreId()
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // 有効な勤怠ステータスを取得
      const { data: statusData } = await supabase
        .from('attendance_statuses')
        .select('name')
        .eq('store_id', storeId)
        .eq('is_active', true)

      const activeStatuses = statusData && statusData.length > 0
        ? statusData.map(s => s.name)
        : ['出勤']

      // 当日の出勤キャストを取得
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('cast_name')
        .eq('store_id', storeId)
        .eq('date', dateStr)
        .in('status', activeStatuses)

      if (error) throw error

      // 重複を除外してユニークなキャスト数をカウント
      const uniqueCasts = new Set(attendanceData?.map(a => a.cast_name) || [])
      setAttendingCastCount(uniqueCasts.size)
    } catch (error) {
      console.error('Error loading attending cast count:', error)
      setAttendingCastCount(0)
    }
  }

  // 席移動
  const executeMove = async (toTable: string) => {
    if (isMoving) return

    setIsMoving(true)

    try {
      const storeId = getCurrentStoreId()
      const response = await fetch('/api/tables/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTableId: moveFromTable,
          toTableId: toTable,
          storeId: storeId
        })
      })

      if (!response.ok) {
        throw new Error('移動に失敗しました')
      }

      endMoveMode()

      // SWRキャッシュを再取得
      setTimeout(() => {
        mutateTableData()
      }, 500)

    } catch (error) {
      console.error('Error moving table:', error)
      alert('移動に失敗しました')
      endMoveMode()
    } finally {
      setIsMoving(false)
    }
  }

  // 長押し開始
  const startMoveMode = (tableId: string) => {
    setMoveMode(true)
    setMoveFromTable(tableId)
    setShowMoveHint(true)
  }

  // 移動モード終了
  const endMoveMode = () => {
    setMoveMode(false)
    setMoveFromTable('')
    setShowMoveHint(false)
    isLongPress.current = false
    setIsMoving(false)
  }

  // テーブル位置を計算する関数
  const calculateTablePosition = (tableId: string) => {
    const tableLayout = tableLayouts.find(t => t.table_name === tableId)
    if (!tableLayout) {
      // フォールバック：元の固定位置を使用
      const originalPosition = tablePositions[tableId as keyof typeof tablePositions]
      if (!originalPosition) return { top: 0, left: 0 }

      return {
        top: originalPosition.top,
        left: originalPosition.left
      }
    }

    return {
      top: tableLayout.position_top,
      left: tableLayout.position_left
    }
  }

  return {
    // State
    tables,
    currentTable,
    setCurrentTable,
    tableLayouts,
    currentPage,
    setCurrentPage,
    maxPageNumber,
    moveMode,
    moveFromTable,
    showMoveHint,
    isMoving,
    attendingCastCount,
    occupiedTableCount,
    isLongPress,

    // Functions
    loadData,
    loadTableLayouts,
    loadAttendingCastCount,
    mutateTableData,  // SWRのmutateを直接エクスポート
    executeMove,
    startMoveMode,
    endMoveMode,
    calculateTablePosition,
    tablePositions
  }
}
