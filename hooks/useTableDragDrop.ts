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
    tables: Array<{ table_name: string; position_top: number; position_left: number }>,
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

    const canvasRect = canvasElement.getBoundingClientRect()
    const newLeft = (clientX - canvasRect.left - dragOffset.x) / autoScale
    const newTop = (clientY - canvasRect.top - dragOffset.y) / autoScale

    setTables(prev => prev.map(t =>
      t.table_name === draggedTable
        ? { ...t, position_left: newLeft, position_top: newTop }
        : t
    ))
  }

  // ドラッグ終了
  const handleDragEnd = async (
    tables: Array<{ table_name: string; position_top: number; position_left: number }>
  ) => {
    if (!draggedTable) return

    const table = tables.find(t => t.table_name === draggedTable)
    if (!table) return

    const storeId = localStorage.getItem('currentStoreId') || '1'
    await supabase
      .from('table_status')
      .update({
        position_top: table.position_top,
        position_left: table.position_left
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
