import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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

    // 現在のテーブルのページを取得
    const currentTable = tables.find(t => t.table_name === draggedTable)
    const currentPageNumber = currentTable?.page_number || 1

    // まず現在のページのエレメントを取得（高速化：querySelectorAllを避ける）
    let targetPageElement = canvasElement.querySelector(`#canvas-area-${currentPageNumber}`) as Element | null
    let targetPageNumber = currentPageNumber

    if (targetPageElement) {
      const currentPageRect = targetPageElement.getBoundingClientRect()

      // 現在のページ内にいるかチェック
      if (clientX >= currentPageRect.left && clientX <= currentPageRect.right &&
          clientY >= currentPageRect.top && clientY <= currentPageRect.bottom) {
        // 現在のページ内にいる場合はそのまま使用
      } else {
        // 現在のページ外の場合のみ、他のページを探す
        const pageElements = canvasElement.querySelectorAll('[id^="canvas-area-"]')
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
      }
    }

    if (targetPageElement) {
      // ターゲットページ内での相対座標を計算
      const pageRect = targetPageElement.getBoundingClientRect()

      // ページのborder幅（固定値2.5px = 平均値）
      const borderWidth = 2.5

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

  // ドラッグ終了（保存は保存ボタンで一括実行）
  const handleDragEnd = (
    tables: Array<{ table_name: string; position_top: number; position_left: number; page_number?: number }>
  ) => {
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
