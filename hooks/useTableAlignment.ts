import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '@/utils/storeContext'

interface TableLayout {
  table_name: string
  position_top: number
  position_left: number
  table_width: number
  table_height: number
  is_visible: boolean
  display_name: string | null
  page_number: number
}

export const useTableAlignment = () => {
  const [showAlignModal, setShowAlignModal] = useState(false)
  const [alignCols, setAlignCols] = useState(3)
  const [alignRows, setAlignRows] = useState(3)
  const [horizontalSpacing, setHorizontalSpacing] = useState(50)
  const [verticalSpacing, setVerticalSpacing] = useState(40)
  const [alignStartX, setAlignStartX] = useState(100)
  const [alignStartY, setAlignStartY] = useState(160)
  const [alignTarget, setAlignTarget] = useState<'all' | 'current'>('all')

  // 整列機能の入力用state（空欄を許可）
  const [alignColsInput, setAlignColsInput] = useState('3')
  const [alignRowsInput, setAlignRowsInput] = useState('3')
  const [horizontalSpacingInput, setHorizontalSpacingInput] = useState('50')
  const [verticalSpacingInput, setVerticalSpacingInput] = useState('40')
  const [alignStartXInput, setAlignStartXInput] = useState('100')
  const [alignStartYInput, setAlignStartYInput] = useState('160')

  // 自動整列を実行
  const executeAlignment = async (
    tables: TableLayout[],
    currentViewPage: number,
    canvasSize: { width: number; height: number },
    forbiddenZones: { top: number; bottom: number; left: number; right: number }
  ) => {
    if (alignTarget === 'current') {
      // 現在のページのみ整列
      const targetTables = tables.filter(t => t.is_visible && (t.page_number || 1) === currentViewPage)

      if (targetTables.length === 0) {
        alert('配置するテーブルがありません')
        return []
      }

      // テーブルサイズは既存のサイズを使用
      const representativeWidth = targetTables[0]?.table_width || 130
      const representativeHeight = targetTables[0]?.table_height || 123

      // 利用可能なスペースを計算
      const availableWidth = canvasSize.width - forbiddenZones.left - forbiddenZones.right
      const availableHeight = canvasSize.height - forbiddenZones.top - forbiddenZones.bottom

      // 全テーブルの合計幅と高さを計算
      const totalTablesWidth = representativeWidth * alignCols + horizontalSpacing * (alignCols - 1)
      const totalTablesHeight = representativeHeight * alignRows + verticalSpacing * (alignRows - 1)

      // 上下左右の余白を均等に配分
      const startX = forbiddenZones.left + (availableWidth - totalTablesWidth) / 2
      const startY = forbiddenZones.top + (availableHeight - totalTablesHeight) / 2

      const alignedTables: TableLayout[] = []
      let tableIndex = 0

      for (let row = 0; row < alignRows; row++) {
        for (let col = 0; col < alignCols; col++) {
          if (tableIndex >= targetTables.length) break

          const table = targetTables[tableIndex]

          const newLeft = startX + col * (representativeWidth + horizontalSpacing)
          const newTop = startY + row * (representativeHeight + verticalSpacing)

          alignedTables.push({
            ...table,
            position_left: newLeft,
            position_top: newTop,
            page_number: currentViewPage
          })
          tableIndex++
        }
      }

      // データベース更新
      const storeId = getCurrentStoreId()
      for (const table of alignedTables) {
        await supabase
          .from('table_status')
          .update({
            position_top: table.position_top,
            position_left: table.position_left,
            page_number: table.page_number
          })
          .eq('table_name', table.table_name)
          .eq('store_id', storeId)
      }

      alert(`${alignedTables.length}個のテーブルをページ${currentViewPage}に配置しました`)
      setShowAlignModal(false)
      return alignedTables

    } else {
      // 全ページのテーブルを各ページごとに整列
      const allVisibleTables = tables.filter(t => t.is_visible)

      if (allVisibleTables.length === 0) {
        alert('配置するテーブルがありません')
        return []
      }

      // ページごとにグループ化
      const tablesByPage = new Map<number, TableLayout[]>()
      allVisibleTables.forEach(table => {
        const pageNum = table.page_number || 1
        if (!tablesByPage.has(pageNum)) {
          tablesByPage.set(pageNum, [])
        }
        tablesByPage.get(pageNum)!.push(table)
      })

      const allAlignedTables: TableLayout[] = []
      const storeId = getCurrentStoreId()

      // 各ページごとに整列
      for (const [pageNum, pageTables] of tablesByPage.entries()) {
        const representativeWidth = pageTables[0]?.table_width || 130
        const representativeHeight = pageTables[0]?.table_height || 123

        // 利用可能なスペースを計算
        const availableWidth = canvasSize.width - forbiddenZones.left - forbiddenZones.right
        const availableHeight = canvasSize.height - forbiddenZones.top - forbiddenZones.bottom

        // 全テーブルの合計幅と高さを計算
        const totalTablesWidth = representativeWidth * alignCols + horizontalSpacing * (alignCols - 1)
        const totalTablesHeight = representativeHeight * alignRows + verticalSpacing * (alignRows - 1)

        // 上下左右の余白を均等に配分
        const startX = forbiddenZones.left + (availableWidth - totalTablesWidth) / 2
        const startY = forbiddenZones.top + (availableHeight - totalTablesHeight) / 2

        let tableIndex = 0
        for (let row = 0; row < alignRows; row++) {
          for (let col = 0; col < alignCols; col++) {
            if (tableIndex >= pageTables.length) break

            const table = pageTables[tableIndex]

            const newLeft = startX + col * (representativeWidth + horizontalSpacing)
            const newTop = startY + row * (representativeHeight + verticalSpacing)

            const alignedTable = {
              ...table,
              position_left: newLeft,
              position_top: newTop,
              page_number: pageNum
            }

            allAlignedTables.push(alignedTable)

            // データベース更新
            await supabase
              .from('table_status')
              .update({
                position_top: alignedTable.position_top,
                position_left: alignedTable.position_left,
                page_number: alignedTable.page_number
              })
              .eq('table_name', alignedTable.table_name)
              .eq('store_id', storeId)

            tableIndex++
          }
        }
      }

      alert(`${allAlignedTables.length}個のテーブルを${tablesByPage.size}ページに配置しました`)
      setShowAlignModal(false)
      return allAlignedTables
    }
  }

  return {
    // State
    showAlignModal,
    setShowAlignModal,
    alignCols,
    setAlignCols,
    alignRows,
    setAlignRows,
    horizontalSpacing,
    setHorizontalSpacing,
    verticalSpacing,
    setVerticalSpacing,
    alignStartX,
    setAlignStartX,
    alignStartY,
    setAlignStartY,
    alignTarget,
    setAlignTarget,
    alignColsInput,
    setAlignColsInput,
    alignRowsInput,
    setAlignRowsInput,
    horizontalSpacingInput,
    setHorizontalSpacingInput,
    verticalSpacingInput,
    setVerticalSpacingInput,
    alignStartXInput,
    setAlignStartXInput,
    alignStartYInput,
    setAlignStartYInput,

    // Functions
    executeAlignment
  }
}
