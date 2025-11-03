import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { TableData } from '../types'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export const useTableManagement = () => {
  const [tables, setTables] = useState<Record<string, TableData>>({})
  const [currentTable, setCurrentTable] = useState('')
  const [tableLayouts, setTableLayouts] = useState<Array<{
    table_name: string
    display_name: string | null
    position_top: number
    position_left: number
    table_width: number
    table_height: number
    is_visible: boolean
    page_number: number
  }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [maxPageNumber, setMaxPageNumber] = useState(1)
  const [moveMode, setMoveMode] = useState(false)
  const [moveFromTable, setMoveFromTable] = useState('')
  const [showMoveHint, setShowMoveHint] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [attendingCastCount, setAttendingCastCount] = useState(0)
  const [occupiedTableCount, setOccupiedTableCount] = useState(0)

  const isLongPress = useRef(false)

  // データ取得
  const loadData = async () => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/tables/status?storeId=${storeId}`)
      const data: TableData[] = await res.json()

      const tableMap: Record<string, TableData> = {}

      // データベースから取得したテーブルレイアウトを使用
      if (tableLayouts.length > 0) {
        // データベースのテーブル情報を使用
        tableLayouts.filter(t => t.is_visible).forEach(layout => {
          tableMap[layout.table_name] = {
            table: layout.table_name,
            name: '',
            oshi: '',
            time: '',
            visit: '',
            elapsed: '',
            status: 'empty'
          }
        })
      } else {
        // フォールバック：固定のテーブル位置を使用
        Object.keys(tablePositions).forEach(tableId => {
          tableMap[tableId] = {
            table: tableId,
            name: '',
            oshi: '',
            time: '',
            visit: '',
            elapsed: '',
            status: 'empty'
          }
        })
      }

      // 取得したデータで更新（tableMapに存在するテーブルのみ）
      data.forEach(item => {
        // tableMapに定義されているテーブルのみ処理
        if (!(item.table in tableMap)) {
          console.warn(`未定義のテーブル「${item.table}」をスキップしました`)
          return
        }

        if (item.time && item.status === 'occupied') {
          const entryTime = new Date(item.time.replace(' ', 'T'))
          const now = new Date()

          // 日付をまたぐ場合の経過時間計算
          let elapsedMin = Math.floor((now.getTime() - entryTime.getTime()) / 60000)

          // 負の値になった場合（日付設定ミスなど）は0にする
          if (elapsedMin < 0) {
            elapsedMin = 0
          }

          // 24時間以上の場合は時間表示も追加
          let elapsedText = ''
          if (elapsedMin >= 1440) { // 24時間以上
            const days = Math.floor(elapsedMin / 1440)
            const hours = Math.floor((elapsedMin % 1440) / 60)
            const mins = elapsedMin % 60
            elapsedText = `${days}日${hours}時間${mins}分`
          } else if (elapsedMin >= 60) { // 1時間以上
            const hours = Math.floor(elapsedMin / 60)
            const mins = elapsedMin % 60
            elapsedText = `${hours}時間${mins}分`
          } else {
            elapsedText = `${elapsedMin}分`
          }

          tableMap[item.table] = {
            ...item,
            elapsed: elapsedText
          }
        } else {
          tableMap[item.table] = item
        }
      })

      setTables(tableMap)

      const occupied = Object.values(tableMap).filter(table => table.status !== 'empty').length
      setOccupiedTableCount(occupied)

    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // テーブルレイアウト取得
  const loadTableLayouts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/tables/list?storeId=${storeId}`)
      const data = await res.json()
      setTableLayouts(data)

      // 最大ページ番号を取得
      if (data && data.length > 0) {
        const maxPage = Math.max(...data.map((t: {page_number?: number}) => t.page_number || 1), 1)
        setMaxPageNumber(maxPage)
      }
    } catch (error) {
      console.error('Error loading table layouts:', error)
    }
  }

  // 出勤中のキャスト数を取得する関数
  const loadAttendingCastCount = async () => {
    try {
      const storeId = getCurrentStoreId()
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // 有効な勤怠ステータスを取得
      const { data: statusData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'active_attendance_statuses')
        .single()

      const activeStatuses = statusData ? JSON.parse(statusData.setting_value) : ['出勤']

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

      setTables(prev => {
        const newTables = { ...prev }
        newTables[toTable] = { ...prev[moveFromTable] }
        newTables[moveFromTable] = {
          table: moveFromTable,
          name: '',
          oshi: '',
          time: '',
          visit: '',
          elapsed: '',
          status: 'empty'
        }

        // 卓数を更新（移動しても卓数は変わらないが、念のため再計算）
        const occupied = Object.values(newTables).filter(table => table.status !== 'empty').length
        setOccupiedTableCount(occupied)

        return newTables
      })

      endMoveMode()

      setTimeout(() => {
        loadData()
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
    setTables,
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
    setOccupiedTableCount,
    isLongPress,

    // Functions
    loadData,
    loadTableLayouts,
    loadAttendingCastCount,
    executeMove,
    startMoveMode,
    endMoveMode,
    calculateTablePosition,
    tablePositions
  }
}
