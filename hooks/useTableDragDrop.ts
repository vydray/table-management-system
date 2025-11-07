import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useTableDragDrop = () => {
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // ドラッグ開始
  const handleDragStart = (
    tableName: string,
    event: React.MouseEvent | React.TouchEvent,
    tableElement: HTMLElement
  ) => {
    setDraggedTable(tableName)

    const rect = tableElement.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    })
  }

  // ドラッグ中
  const handleDragMove = (
    event: React.MouseEvent | React.TouchEvent,
    autoScale: number,
    canvasElement: HTMLElement | null,
    tables: Array<{ table_name: string; position_top: number; position_left: number; page_number?: number }>,
    setTables: (updater: (prev: any[]) => any[]) => void
  ) => {
    if (!draggedTable || !canvasElement) return

    let clientX: number, clientY: number

    if ('touches' in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    // 全ページエレメントを取得して、マウス/指の位置がどのページの上にあるかを判定
    const pageElements = canvasElement.querySelectorAll('[id^="canvas-area-"]')
    let targetPageNumber = 1
    let targetPageElement: Element | null = null

    for (const pageEl of Array.from(pageElements)) {
      const rect = pageEl.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        const pageNum = parseInt(pageEl.id.replace('canvas-area-', ''))
        if (!isNaN(pageNum)) {
          targetPageNumber = pageNum
          targetPageElement = pageEl
          break
        }
      }
    }

    // ターゲットページが見つからない場合は、現在のテーブルのページを維持
    if (!targetPageElement) {
      const currentTable = tables.find(t => t.table_name === draggedTable)
      if (currentTable) {
        targetPageNumber = currentTable.page_number || 1
        targetPageElement = canvasElement.querySelector(`#canvas-area-${targetPageNumber}`)
      }
    }

    if (targetPageElement) {
      // ターゲットページ内での相対座標を計算
      const pageRect = targetPageElement.getBoundingClientRect()

      // ページのborder幅（固定値：現在のページは3px、それ以外は2px）
      // getComputedStyleを使わずに固定値を使用することでパフォーマンス向上
      const borderWidth = targetPageElement.style.borderWidth ?
        parseFloat(targetPageElement.style.borderWidth) : 2.5 // 平均値を使用

      // borderの内側を基準にした座標を計算
      const newLeft = (clientX - pageRect.left - borderWidth - dragOffset.x) / autoScale
      const newTop = (clientY - pageRect.top - borderWidth - dragOffset.y) / autoScale

      setTables(prev => prev.map(t =>
        t.table_name === draggedTable
          ? { ...t, position_left: newLeft, position_top: newTop, page_number: targetPageNumber }
          : t
      ))
    }
  }

  // ドラッグ終了
  const handleDragEnd = async (
    tables: Array<{ table_name: string; position_top: number; position_left: number; page_number?: number }>
  ) => {
    if (!draggedTable) return

    const table = tables.find(t => t.table_name === draggedTable)
    if (!table) return

    const storeId = localStorage.getItem('currentStoreId') || '1'
    await supabase
      .from('table_status')
      .update({
        position_top: table.position_top,
        position_left: table.position_left,
        page_number: table.page_number || 1
      })
      .eq('table_name', draggedTable)
      .eq('store_id', storeId)

    setDraggedTable(null)
  }

  return {
    // State
    draggedTable,
    setDraggedTable,
    dragOffset,
    setDragOffset,

    // Functions
    handleDragStart,
    handleDragMove,
    handleDragEnd
  }
}
