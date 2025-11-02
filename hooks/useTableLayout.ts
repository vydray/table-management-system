import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TableLayout {
  table_name: string
  position_top: number
  position_left: number
  table_width: number
  table_height: number
  is_visible: boolean
  display_name: string | null
  page_number: number
  current_guest?: string | null
  guest_name?: string | null
  cast_name?: string | null
  entry_time?: string | null
  visit_type?: string | null
}

export const useTableLayout = () => {
  const [tables, setTables] = useState<TableLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(1)

  // テーブルデータの読み込み
  const loadTables = async () => {
    setLoading(true)
    const storeId = localStorage.getItem('currentStoreId') || '1'

    const { data, error } = await supabase
      .from('table_status')
      .select('*')
      .eq('store_id', storeId)
      .order('table_name')

    if (!error && data) {
      setTables(data.map((table) => ({
        ...table,
        page_number: table.page_number || 1
      })))

      const maxPage = Math.max(...data.map((t) => t.page_number || 1), 1)
      setPageCount(maxPage)

      setLoading(false)
      return data
    }
    setLoading(false)
    return []
  }

  // 新規テーブル追加
  const addNewTable = async (
    tableName: string,
    currentViewPage: number,
    tableSize: { width: number; height: number }
  ) => {
    if (!tableName) return false
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const newTable = {
      table_name: tableName,
      position_top: 100,
      position_left: 100,
      table_width: tableSize.width,
      table_height: tableSize.height,
      is_visible: true,
      store_id: storeId,
      page_number: currentViewPage
    }

    const { error } = await supabase
      .from('table_status')
      .insert(newTable)

    if (!error) {
      await loadTables()
      return true
    }
    return false
  }

  // テーブル削除
  const deleteTable = async (tableName: string) => {
    if (!confirm(`テーブル「${tableName}」を削除しますか？`)) return false
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .delete()
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      await loadTables()
      return true
    }
    return false
  }

  // テーブル表示/非表示切り替え
  const toggleTableVisibility = async (tableName: string, isVisible: boolean) => {
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .update({ is_visible: isVisible })
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.map(t =>
        t.table_name === tableName ? { ...t, is_visible: isVisible } : t
      ))
      return true
    }
    return false
  }

  // テーブル表示名の更新
  const updateTableDisplayName = async (table: TableLayout) => {
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const displayName = table.display_name || table.table_name

    const { error } = await supabase
      .from('table_status')
      .update({
        display_name: displayName,
        page_number: table.page_number
      })
      .eq('table_name', table.table_name)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.map(t =>
        t.table_name === table.table_name
          ? { ...t, display_name: displayName, page_number: table.page_number }
          : t
      ))
      return true
    }
    return false
  }

  // テーブル位置の更新
  const updateTablePosition = async (
    tableName: string,
    position: { top: number; left: number }
  ) => {
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .update({
        position_top: position.top,
        position_left: position.left
      })
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.map(t =>
        t.table_name === tableName
          ? { ...t, position_top: position.top, position_left: position.left }
          : t
      ))
      return true
    }
    return false
  }

  // 全テーブルのサイズを一括更新
  const updateAllTableSizes = async (newSize: { width: number; height: number }) => {
    const storeId = localStorage.getItem('currentStoreId') || '1'

    for (const table of tables) {
      await supabase
        .from('table_status')
        .update({
          table_width: newSize.width,
          table_height: newSize.height
        })
        .eq('table_name', table.table_name)
        .eq('store_id', storeId)
    }

    setTables(prev => prev.map(t => ({
      ...t,
      table_width: newSize.width,
      table_height: newSize.height
    })))

    return true
  }

  // ページ追加
  const addPage = () => {
    setPageCount(prev => prev + 1)
  }

  // ページ削除
  const deletePage = async (pageNum: number) => {
    if (pageNum === 1) {
      alert('ページ1は削除できません')
      return false
    }

    const tablesOnPage = tables.filter(t => t.page_number === pageNum)
    if (tablesOnPage.length > 0) {
      if (!confirm(`ページ${pageNum}には${tablesOnPage.length}個のテーブルがあります。ページを削除しますか？`)) {
        return false
      }
    }

    const storeId = localStorage.getItem('currentStoreId') || '1'
    for (const table of tablesOnPage) {
      await supabase
        .from('table_status')
        .delete()
        .eq('table_name', table.table_name)
        .eq('store_id', storeId)
    }

    setPageCount(prev => prev - 1)
    await loadTables()
    return true
  }

  return {
    // State
    tables,
    setTables,
    loading,
    pageCount,
    setPageCount,

    // Functions
    loadTables,
    addNewTable,
    deleteTable,
    toggleTableVisibility,
    updateTableDisplayName,
    updateTablePosition,
    updateAllTableSizes,
    addPage,
    deletePage
  }
}
