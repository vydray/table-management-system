import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
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

interface ScreenRatio {
  label: string
  width: number
  height: number
}

// 固定値に変更
const presetRatios: ScreenRatio[] = [
  { label: '2176×1600（標準）', width: 2176, height: 1600 }
]

export default function TableLayoutEdit() {
  const router = useRouter()
  const [tables, setTables] = useState<TableLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedTable, setSelectedTable] = useState<TableLayout | null>(null)
  const [newTableName, setNewTableName] = useState('')
  
  // windowWidth削除
  
  // 画面比率関連の状態
  const [selectedRatio, setSelectedRatio] = useState('2176×1600（標準）')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 2176, height: 1600 }) // 固定値に変更
  
  // 整列機能用の状態
  const [showAlignModal, setShowAlignModal] = useState(false)
  const [alignCols, setAlignCols] = useState(3)
  const [alignRows, setAlignRows] = useState(3)
  const [horizontalSpacing, setHorizontalSpacing] = useState(50)
  const [verticalSpacing, setVerticalSpacing] = useState(40)
  const [alignStartX, setAlignStartX] = useState(100)
  const [alignStartY, setAlignStartY] = useState(100)
  const [alignTarget, setAlignTarget] = useState<'all' | 'current'>('all')
  
  // テーブルサイズ設定
  const [tableSize, setTableSize] = useState({ width: 130, height: 123 })
  const [isUpdatingSize, setIsUpdatingSize] = useState(false)
  
  // ズーム関連
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const isPinching = useRef(false)
  const lastPinchDistance = useRef(0)
  const lastPanPoint = useRef({ x: 0, y: 0 })
  
  // ページ管理
  const [pageCount, setPageCount] = useState(1)
  const [currentViewPage, setCurrentViewPage] = useState(1)
  
  // 配置禁止ゾーン
  const forbiddenZones = {
    top: 80,
    bottom: 60,
    left: 0,
    right: 0
  }

  // テーブルデータの読み込み
  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    setLoading(true)
    const storeId = localStorage.getItem('currentStoreId') || '1'
    
    const { data, error } = await supabase
      .from('table_status')
      .select('*')
      .eq('store_id', storeId)
      .order('table_name')

    if (!error && data) {
      setTables(data.map((table: any) => ({
        ...table,
        page_number: table.page_number || 1
      })))
      
      const maxPage = Math.max(...data.map((t: any) => t.page_number || 1), 1)
      setPageCount(maxPage)
    }
    setLoading(false)
  }

  // 新規テーブル追加
  const addNewTable = async () => {
    if (!newTableName) return

    const storeId = localStorage.getItem('currentStoreId') || '1'
    const newTable = {
      table_name: newTableName,
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
      setNewTableName('')
    }
  }

  // テーブル削除
  const deleteTable = async (tableName: string) => {
    if (!confirm(`テーブル「${tableName}」を削除しますか？`)) return

    const storeId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .delete()
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      await loadTables()
    }
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
    }
  }

  // テーブル表示名の更新
  const updateTableDisplayName = async () => {
    if (!selectedTable) return

    const storeId = localStorage.getItem('currentStoreId') || '1'
    const displayName = selectedTable.display_name || selectedTable.table_name
    
    const { error } = await supabase
      .from('table_status')
      .update({ 
        display_name: displayName,
        page_number: selectedTable.page_number 
      })
      .eq('table_name', selectedTable.table_name)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.map(t =>
        t.table_name === selectedTable.table_name 
          ? { ...t, display_name: displayName, page_number: selectedTable.page_number } 
          : t
      ))
      setSelectedTable(null)
    }
  }

  // テーブル位置を更新
  const updateTablePosition = async (tableName: string, top: number, left: number) => {
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .update({ position_top: top, position_left: left })
      .eq('table_name', tableName)
      .eq('store_id', storeId)
    if (error) {
      console.error('位置更新エラー:', error)
    }
  }

  // 自動整列を実行
  const executeAlignment = async () => {
    let targetTables: TableLayout[] = []
    if (alignTarget === 'current') {
      targetTables = tables.filter(t => t.is_visible && (t.page_number || 1) === currentViewPage)
    } else {
      targetTables = tables.filter(t => t.is_visible)
    }
    
    if (targetTables.length === 0) {
      alert('配置するテーブルがありません')
      return
    }

    let maxTableWidth = 0
    let maxTableHeight = 0
    
    targetTables.forEach(table => {
      const width = table.table_width || 130
      const height = table.table_height || 123
      if (width > maxTableWidth) maxTableWidth = width
      if (height > maxTableHeight) maxTableHeight = height
    })

    const tablesPerPage = alignCols * alignRows
    const neededPages = Math.ceil(targetTables.length / tablesPerPage)
    const startPage = alignTarget === 'current' ? currentViewPage : 1
    const endPage = startPage + neededPages - 1
    
    if (endPage > pageCount) {
      setPageCount(endPage)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const alignedTables: TableLayout[] = []
    let remainingTables = [...targetTables]
    let currentPage = startPage
    
    while (remainingTables.length > 0 && currentPage <= endPage) {
      const tablesForThisPage = remainingTables.slice(0, tablesPerPage)
      remainingTables = remainingTables.slice(tablesPerPage)
      
      let tableIndex = 0
      for (let row = 0; row < alignRows; row++) {
        for (let col = 0; col < alignCols; col++) {
          if (tableIndex >= tablesForThisPage.length) break
          
          const table = tablesForThisPage[tableIndex]
          const tableWidth = table.table_width || 130
          const tableHeight = table.table_height || 123
          
          const newLeft = alignStartX + col * (maxTableWidth + horizontalSpacing)
          const newTop = alignStartY + row * (maxTableHeight + verticalSpacing)
          
          const maxX = canvasSize.width - tableWidth - forbiddenZones.right
          const maxY = canvasSize.height - tableHeight - forbiddenZones.bottom
          
          if (newLeft <= maxX && newTop <= maxY) {
            alignedTables.push({
              ...table,
              position_left: newLeft,
              position_top: newTop,
              page_number: currentPage
            })
            tableIndex++
          }
        }
      }
      
      currentPage++
    }

    const storeId = localStorage.getItem('currentStoreId') || '1'
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

    setTables(prev => prev.map(t => {
      const aligned = alignedTables.find(at => at.table_name === t.table_name)
      return aligned ? aligned : t
    }))

    const updatedCount = alignedTables.length
    const totalPages = endPage - startPage + 1
    const newPagesCreated = endPage > pageCount ? endPage - pageCount : 0
    
    let message = `${updatedCount}個のテーブルを配置しました`
    if (newPagesCreated > 0) {
      message += `\n${newPagesCreated}ページを新規追加しました`
    }
    if (totalPages > 1) {
      message += `\nページ${startPage}〜${endPage}に配置されています`
    }
    
    alert(message)
    setShowAlignModal(false)
  }

  // ページ追加
  const addPage = () => {
    setPageCount(prev => prev + 1)
  }

  // ページ削除
  const deletePage = async (pageNum: number) => {
    if (pageNum === 1) {
      alert('ページ1は削除できません')
      return
    }
    
    const tablesOnPage = tables.filter(t => t.page_number === pageNum)
    if (tablesOnPage.length > 0) {
      if (!confirm(`ページ${pageNum}には${tablesOnPage.length}個のテーブルがあります。ページを削除しますか？`)) {
        return
      }
    }
    
    setPageCount(prev => Math.max(1, prev - 1))
    
    const storeId = localStorage.getItem('currentStoreId') || '1'
    for (const table of tablesOnPage) {
      await supabase
        .from('table_status')
        .update({ page_number: 1 })
        .eq('table_name', table.table_name)
        .eq('store_id', storeId)
    }
    
    await loadTables()
    
    if (currentViewPage > pageCount - 1) {
      setCurrentViewPage(pageCount - 1)
    }
  }

  // 画面比率の変更
  const handleRatioChange = (value: string) => {
    setSelectedRatio(value)
    const ratio = presetRatios.find(r => r.label === value)
    if (ratio && ratio.width > 0) {
      setCanvasSize({ width: ratio.width, height: ratio.height })
    }
    if (value === 'カスタム...') {
      setCustomWidth('')
      setCustomHeight('')
    }
  }

  // カスタムサイズ適用
  const applyCustomSize = () => {
    const width = parseInt(customWidth)
    const height = parseInt(customHeight)
    
    if (width > 0 && height > 0) {
      setCanvasSize({ width, height })
    }
  }

  // 全テーブルのサイズを更新
  const updateAllTableSizes = async () => {
    setIsUpdatingSize(true)

    const storeId = localStorage.getItem('currentStoreId') || '1'
    for (const table of tables) {
      await supabase
        .from('table_status')
        .update({ 
          table_width: tableSize.width,
          table_height: tableSize.height
        })
        .eq('table_name', table.table_name)
        .eq('store_id', storeId)
    }

    setTables(prev => prev.map(t => ({
      ...t,
      table_width: tableSize.width,
      table_height: tableSize.height
    })))

    setIsUpdatingSize(false)
  }

  // ピンチズームの距離計算
  const getPinchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // キャンバスのタッチ/マウス操作
  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggedTable) return
    
    const target = e.target as HTMLElement
    if (target.style.cursor === 'move') return
    
    if (target.id && (target.id.startsWith('canvas-area') || target === canvasRef.current)) {
      if ('touches' in e) {
        if (e.touches.length === 2) {
          isPinching.current = true
          lastPinchDistance.current = getPinchDistance(e.touches[0], e.touches[1])
          e.preventDefault()
        } else if (e.touches.length === 1) {
          isPanning.current = true
          lastPanPoint.current = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
          }
        }
      } else {
        if (e.button === 1 || e.ctrlKey || e.metaKey) {
          isPanning.current = true
          lastPanPoint.current = { x: e.clientX, y: e.clientY }
          e.preventDefault()
        }
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      if (isPinching.current && e.touches.length === 2) {
        const currentDistance = getPinchDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / lastPinchDistance.current
        const newZoom = Math.max(0.5, Math.min(3, zoom * scale))
        setZoom(newZoom)
        lastPinchDistance.current = currentDistance
        e.preventDefault()
      } else if (isPanning.current && e.touches.length === 1) {
        lastPanPoint.current = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        }
      }
    } else if (isPanning.current) {
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleCanvasMouseUp = () => {
    isPanning.current = false
    isPinching.current = false
  }

  // ズーム操作
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(2, zoom * delta))
    setZoom(newZoom)
  }

  // ドラッグ開始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, table: TableLayout) => {
    e.stopPropagation()
    
    if (isPanning.current) return
    
    if ('touches' in e && e.touches.length > 1) return
    
    const pageNum = table.page_number || 1
    const canvas = document.getElementById(`canvas-area-${pageNum}`)
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const actualX = (clientX - rect.left) / zoom
    const actualY = (clientY - rect.top) / zoom
    
    setDraggedTable(table.table_name)
    setDragOffset({
      x: actualX - table.position_left,
      y: actualY - table.position_top
    })
    
    if ('touches' in e) {
      e.preventDefault()
    }
  }

  // ドラッグ中
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTable) return
    e.preventDefault()
    
    const table = tables.find(t => t.table_name === draggedTable)
    if (!table) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    let targetPageNum = table.page_number || 1
    
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const canvas = document.getElementById(`canvas-area-${pageNum}`)
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          targetPageNum = pageNum
          break
        }
      }
    }
    
    const canvas = document.getElementById(`canvas-area-${targetPageNum}`)
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const actualX = (clientX - rect.left) / zoom
    const actualY = (clientY - rect.top) / zoom
    
    const minX = forbiddenZones.left
    const maxX = canvasSize.width - table.table_width - forbiddenZones.right
    const minY = forbiddenZones.top
    const maxY = canvasSize.height - table.table_height - forbiddenZones.bottom
    
    const newLeft = Math.max(minX, Math.min(actualX - dragOffset.x, maxX))
    const newTop = Math.max(minY, Math.min(actualY - dragOffset.y, maxY))
    
    setTables(prev => prev.map(t => 
      t.table_name === draggedTable 
        ? { ...t, position_top: newTop, position_left: newLeft, page_number: targetPageNum }
        : t
    ))
  }

  // ドラッグ終了
  const handleDragEnd = async () => {
    if (draggedTable) {
      const table = tables.find(t => t.table_name === draggedTable)
      if (table) {
        await updateTablePosition(table.table_name, table.position_top, table.position_left)
        
        const storeId = localStorage.getItem('currentStoreId') || '1'
        await supabase
          .from('table_status')
          .update({ page_number: table.page_number })
          .eq('table_name', table.table_name)
          .eq('store_id', storeId)
      }
      setDraggedTable(null)
    }
  }

  // ダブルクリックで編集
  const handleDoubleClick = (table: TableLayout) => {
    setSelectedTable(table)
  }

  return (
    <>
      <Head>
        <title>🎨 テーブル配置編集 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#FF9800',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minHeight: '60px'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            🎨 テーブル配置編集
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAlignModal(true)}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ 自動整列
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ホームに戻る
            </button>
          </div>
        </div>
        
        {/* ページコントロール */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          backgroundColor: 'white',
          borderBottom: '1px solid #ddd',
          gap: '20px'
        }}>
          <button
            onClick={addPage}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ＋ ページ追加
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'auto' }}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
              <div
                key={pageNum}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentViewPage === pageNum ? '#FF9800' : '#f0f0f0',
                  color: currentViewPage === pageNum ? 'white' : 'black',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  position: 'relative',
                  minWidth: '80px',
                  textAlign: 'center'
                }}
                onClick={() => setCurrentViewPage(pageNum)}
              >
                ページ {pageNum}
                {pageNum > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePage(pageNum)
                    }}
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          flexDirection: 'row'
        }}>
          {/* サイドバー */}
          <div style={{
            width: '320px',
            height: 'auto',
            maxHeight: '100%',
            backgroundColor: 'white',
            borderRight: '1px solid #ddd',
            padding: '20px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* 新規テーブル追加 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>新規テーブル追加</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                <input
                  type="text"
                  placeholder="テーブル名"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 'auto',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={addNewTable}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  追加
                </button>
              </div>
            </div>

            {/* テーブルサイズ設定 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                テーブルサイズ（全体）
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', minWidth: '30px' }}>幅:</label>
                <input
                  type="number"
                  value={tableSize.width}
                  onChange={(e) => setTableSize({ ...tableSize, width: parseInt(e.target.value) || 130 })}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
                <span style={{ fontSize: '13px' }}>px</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', minWidth: '30px' }}>高さ:</label>
                <input
                  type="number"
                  value={tableSize.height}
                  onChange={(e) => setTableSize({ ...tableSize, height: parseInt(e.target.value) || 123 })}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
                <span style={{ fontSize: '13px' }}>px</span>
              </div>
              <button
                onClick={updateAllTableSizes}
                disabled={isUpdatingSize}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: isUpdatingSize ? '#ccc' : '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isUpdatingSize ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isUpdatingSize ? '更新中...' : '全テーブルに適用'}
              </button>
            </div>

            {/* ズームコントロール */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                ズーム: {Math.round(zoom * 100)}%
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ー
                </button>
                <button
                  onClick={() => setZoom(1)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#616161',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  100%
                </button>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ＋
                </button>
              </div>
            </div>

            {/* テーブル一覧 */}
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>テーブル一覧</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {tables.map(table => (
                  <div
                    key={table.table_name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderBottom: '1px solid #eee',
                      gap: '8px',
                      fontSize: '16px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={table.is_visible}
                      onChange={(e) => toggleTableVisibility(table.table_name, e.target.checked)}
                      style={{ cursor: 'pointer', minWidth: '16px', minHeight: '16px' }}
                    />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {table.display_name || table.table_name}
                    </span>
                    <button
                      onClick={() => setSelectedTable(table)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteTable(table.table_name)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {loading && <div style={{ textAlign: 'center', marginTop: '20px' }}>読み込み中...</div>}
          </div>

          {/* キャンバスエリア - 横並び表示 */}
          <div
            ref={canvasRef}
            onWheel={handleWheel}
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#e0e0e0',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              gap: '10px',
              padding: '10px',
              alignItems: 'flex-start'
            }}
          >
            {/* 各ページのキャンバス */}
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
              <div
                key={pageNum}
                id={`canvas-area-${pageNum}`}
                style={{
                  minWidth: `${canvasSize.width}px`,
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                  backgroundColor: '#f0f0f0',
                  border: currentViewPage === pageNum ? '3px solid #FF9800' : '1px solid #ccc',
                  borderRadius: '8px',
                  position: 'relative',
                  cursor: draggedTable ? 'grabbing' : 'default',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
              >
                {/* ページ番号表示 */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  zIndex: 10
                }}>
                  ページ {pageNum}
                </div>

                {/* 配置禁止ゾーン表示 */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${forbiddenZones.top}px`,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderBottom: '2px dashed #ff0000',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#ff0000'
                }}>
                  ヘッダーエリア（配置不可）
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${forbiddenZones.bottom}px`,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderTop: '2px dashed #ff0000',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#ff0000'
                }}>
                  Androidナビゲーションバーエリア（配置不可）
                </div>

                {/* テーブル表示 */}
                {tables
                  .filter(table => table.is_visible && (table.page_number || 1) === pageNum)
                  .map(table => (
                    <div
                      key={table.table_name}
                      onDoubleClick={() => handleDoubleClick(table)}
                      style={{
                        position: 'absolute',
                        top: `${table.position_top}px`,
                        left: `${table.position_left}px`,
                        width: `${table.table_width || 130}px`,
                        height: `${table.table_height || 123}px`,
                        backgroundColor: table.current_guest ? '#ffe0f0' : table.guest_name ? '#FF9800' : '#ccc',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'move',
                        userSelect: 'none',
                        boxShadow: draggedTable === table.table_name 
                          ? '0 4px 16px rgba(0,0,0,0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        opacity: draggedTable === table.table_name ? 0.8 : 1,
                        transition: 'box-shadow 0.2s',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => handleDragStart(e, table)}
                      onMouseUp={handleDragEnd}
                      onTouchStart={(e) => handleDragStart(e, table)}
                      onTouchMove={(e) => {
                        e.preventDefault()
                        handleDragMove(e)
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault()
                        handleDragEnd()
                      }}
                    >
                      {table.display_name || table.table_name}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* 編集ダイアログ */}
        {selectedTable && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              minWidth: '300px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>テーブル編集</h3>
              
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                テーブル名:
              </label>
              <input
                type="text"
                value={selectedTable.display_name || selectedTable.table_name}
                onChange={(e) => setSelectedTable({ ...selectedTable, display_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              />
              
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                配置ページ:
              </label>
              <select
                value={selectedTable.page_number || 1}
                onChange={(e) => setSelectedTable({ ...selectedTable, page_number: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              >
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
                  <option key={pageNum} value={pageNum}>
                    ページ {pageNum}
                  </option>
                ))}
              </select>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={updateTableDisplayName}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  保存
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 自動整列モーダル */}
        {showAlignModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚡ テーブル自動整列
              </h2>

              {/* 対象選択 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>🎯 整列対象</h3>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="alignTarget"
                      value="all"
                      checked={alignTarget === 'all'}
                      onChange={(e) => setAlignTarget(e.target.value as 'all' | 'current')}
                    />
                    すべてのテーブル
                  </label>
                  
                  <label style={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="alignTarget"
                      value="current"
                      checked={alignTarget === 'current'}
                      onChange={(e) => setAlignTarget(e.target.value as 'all' | 'current')}
                    />
                    現在のページのみ
                  </label>
                </div>
                
                {alignTarget === 'all' && tables.filter(t => t.is_visible).length > alignCols * alignRows && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#1976d2'
                  }}>
                    💡 テーブル数が多い場合、自動的に次のページに配置されます
                  </div>
                )}
              </div>
              
              {/* グリッド設定 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📐 グリッド設定</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    横の個数（列数）:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={alignCols}
                    onChange={(e) => setAlignCols(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    縦の個数（行数）:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={alignRows}
                    onChange={(e) => setAlignRows(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    横の間隔 (px):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    step="10"
                    value={horizontalSpacing}
                    onChange={(e) => setHorizontalSpacing(parseInt(e.target.value) || 50)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    縦の間隔 (px):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    step="10"
                    value={verticalSpacing}
                    onChange={(e) => setVerticalSpacing(parseInt(e.target.value) || 40)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    const avgTableWidth = 130
                    const avgTableHeight = 123
                    const usableWidth = canvasSize.width - alignStartX - forbiddenZones.right - 100
                    const usableHeight = canvasSize.height - alignStartY - forbiddenZones.bottom - 100
                    
                    if (alignCols > 1) {
                      const optimalHorizontal = Math.max(20, Math.floor((usableWidth - alignCols * avgTableWidth) / (alignCols - 1)))
                      setHorizontalSpacing(Math.min(200, optimalHorizontal))
                    }
                    
                    if (alignRows > 1) {
                      const optimalVertical = Math.max(20, Math.floor((usableHeight - alignRows * avgTableHeight) / (alignRows - 1)))
                      setVerticalSpacing(Math.min(200, optimalVertical))
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginTop: '10px'
                  }}
                >
                  🎯 最適な間隔を自動計算
                </button>
              </div>

              {/* 配置開始位置 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📍 配置開始位置</h3>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      X座標:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      step="10"
                      value={alignStartX}
                      onChange={(e) => setAlignStartX(parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Y座標:
                    </label>
                    <input
                      type="number"
                      min={forbiddenZones.top}
                      max="500"
                      step="10"
                      value={alignStartY}
                      onChange={(e) => setAlignStartY(parseInt(e.target.value) || forbiddenZones.top)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* プレビュー情報 */}
              <div style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  📊 プレビュー情報
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                  • 配置可能なテーブル数: {tables.filter(t => t.is_visible).length}個<br />
                  • グリッドの容量: {alignCols * alignRows}個<br />
                  • 実際に配置される数: {Math.min(tables.filter(t => t.is_visible).length, alignCols * alignRows)}個<br />
                  • 必要な横幅: 約{alignCols * 130 + (alignCols - 1) * horizontalSpacing}px<br />
                  • 必要な縦幅: 約{alignRows * 123 + (alignRows - 1) * verticalSpacing}px
                </p>
              </div>

              {/* 警告メッセージ */}
              {(alignCols * 130 + (alignCols - 1) * horizontalSpacing + alignStartX > canvasSize.width ||
                alignRows * 123 + (alignRows - 1) * verticalSpacing + alignStartY > canvasSize.height) && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  ⚠️ 現在の設定では、一部のテーブルが画面外になる可能性があります。
                  「最適な間隔を自動計算」ボタンを押すか、間隔を調整してください。
                </div>
              )}

              {/* ボタン */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={executeAlignment}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  整列実行
                </button>
                <button
                  onClick={() => setShowAlignModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* グローバルイベントリスナー */}
      <div
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: draggedTable ? 'auto' : 'none',
          zIndex: draggedTable ? 999 : -1
        }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={(e) => {
          if (draggedTable) {
            e.preventDefault()
            handleDragMove(e)
          }
        }}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
      />
    </>
  )
}