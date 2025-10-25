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
  page_number: number  // ⭐ 追加
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

const presetRatios: ScreenRatio[] = [
  { label: '1280×800（PC）', width: 1280, height: 800 },
  { label: '1024×768（タブレット）', width: 1024, height: 768 },
  { label: '768×1024（タブレット縦）', width: 768, height: 1024 },
  { label: '2000×1200（大画面）', width: 2000, height: 1200 },
  { label: 'カスタム...', width: 0, height: 0 }
]

export default function TableLayoutEdit() {
  const router = useRouter()
  const [tables, setTables] = useState<TableLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedTable, setSelectedTable] = useState<TableLayout | null>(null)
  const [newTableName, setNewTableName] = useState('')
  const [windowWidth, setWindowWidth] = useState(1280)
  
  // 画面比率関連の状態
  const [selectedRatio, setSelectedRatio] = useState('1280×800（PC）')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 800 })
  
  // ⭐ 整列機能用の状態を修正（tableSpacingを削除して、縦横別々に）
  const [showAlignModal, setShowAlignModal] = useState(false)
  const [alignCols, setAlignCols] = useState(4)  // 横の個数
  const [alignRows, setAlignRows] = useState(3)  // 縦の個数  
  const [horizontalSpacing, setHorizontalSpacing] = useState(50) // ⭐ 横の間隔（変更）
  const [verticalSpacing, setVerticalSpacing] = useState(40) // ⭐ 縦の間隔（新規追加）
  const [alignStartX, setAlignStartX] = useState(100) // 配置開始X座標
  const [alignStartY, setAlignStartY] = useState(100) // 配置開始Y座標
  
  // ⭐ ページ管理用の状態を追加
  const [pageCount, setPageCount] = useState(1)  // 総ページ数
  const [currentViewPage, setCurrentViewPage] = useState(1)  // 現在フォーカス中のページ
  
  // テーブルサイズ関連の状態
  const [tableSize, setTableSize] = useState({ width: 130, height: 123 })
  const [isUpdatingSize, setIsUpdatingSize] = useState(false)
  
  // ズーム関連の状態
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPanPoint = useRef({ x: 0, y: 0 })
  
  // ピンチズーム用の状態
  const isPinching = useRef(false)
  const lastPinchDistance = useRef(0)
  
  // 配置禁止ゾーンの定義
  const forbiddenZones = {
    top: 80,     // ヘッダーの高さ + 余白
    bottom: 60,  // Androidナビゲーションバーの高さ
    left: 0,
    right: 0
  }

  // ウィンドウサイズの監視
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 初期化処理
  useEffect(() => {
    loadTables()
  }, [])



  // テーブル情報を読み込む
  const loadTables = async () => {
    setLoading(true)
    try {
      const storeId = localStorage.getItem('currentStoreId') || '1'
      const { data, error } = await supabase
        .from('table_status')
        .select('*')
        .eq('store_id', storeId)
        .order('page_number, table_name')  // ⭐ ページ番号でソート

      if (!error && data) {
        setTables(data)
        // ⭐ 最大ページ番号を取得
        const maxPage = Math.max(...data.map(t => t.page_number || 1), 1)
        setPageCount(maxPage)
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    }
    setLoading(false)
  }

  // テーブル名を更新
  const updateTableName = async (tableName: string, displayName: string) => {
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .update({ display_name: displayName })
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.map(t => 
        t.table_name === tableName ? { ...t, display_name: displayName } : t
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

  // ⭐ 自動整列を実行（完全に置き換え）
  const executeAlignment = async () => {
    const visibleTables = tables.filter(t => t.is_visible)
    if (visibleTables.length === 0) {
      alert('配置するテーブルがありません')
      return
    }

    // ⭐ テーブルの最大サイズを取得（重ならないようにするため）
    let maxTableWidth = 0
    let maxTableHeight = 0
    
    visibleTables.forEach(table => {
      const width = table.table_width || 130  // デフォルト値は実際のテーブルサイズに
      const height = table.table_height || 123
      if (width > maxTableWidth) maxTableWidth = width
      if (height > maxTableHeight) maxTableHeight = height
    })

    // 最大サイズに基づいて配置を計算
    const alignedTables: TableLayout[] = []
    let tableIndex = 0

    for (let row = 0; row < alignRows; row++) {
      for (let col = 0; col < alignCols; col++) {
        if (tableIndex >= visibleTables.length) break

        const table = visibleTables[tableIndex]
        const tableWidth = table.table_width || 130
        const tableHeight = table.table_height || 123
        
        // ⭐ 最大サイズを基準に配置（horizontalSpacing と verticalSpacing を使用）
        const newLeft = alignStartX + col * (maxTableWidth + horizontalSpacing)
        const newTop = alignStartY + row * (maxTableHeight + verticalSpacing)

        // 配置禁止ゾーンと画面端をチェック
        const maxX = canvasSize.width - tableWidth - forbiddenZones.right
        const maxY = canvasSize.height - tableHeight - forbiddenZones.bottom

        if (newLeft <= maxX && newTop <= maxY) {
          alignedTables.push({
            ...table,
            position_left: newLeft,
            position_top: newTop
          })
          tableIndex++
        } else {
          console.warn(`テーブル ${table.table_name} は画面外になるためスキップしました`)
        }
      }
    }

    // ⭐ 配置できなかったテーブルがある場合の処理
    const skippedCount = visibleTables.length - alignedTables.length
    
    // 更新されたテーブル位置を保存
    for (const table of alignedTables) {
      await updateTablePosition(table.table_name, table.position_top, table.position_left)
    }

    // ローカルの状態を更新
    setTables(prev => prev.map(t => {
      const aligned = alignedTables.find(at => at.table_name === t.table_name)
      return aligned ? aligned : t
    }))

    setShowAlignModal(false)
    
    // ⭐ 結果を通知
    if (skippedCount > 0) {
      alert(`${alignedTables.length}個のテーブルを整列しました。\n${skippedCount}個のテーブルは画面外のため配置できませんでした。`)
    } else {
      alert(`${alignedTables.length}個のテーブルを整列しました`)
    }
  }

    // ⭐ ページを追加
  const addPage = () => {
    setPageCount(prev => prev + 1)
    // 新しいページにフォーカス
    setTimeout(() => {
      setCurrentViewPage(pageCount + 1)
    }, 100)
  }

  // ⭐ ページを削除
  const deletePage = async (pageNumber: number) => {
    if (pageNumber === 1) {
      alert('ページ1は削除できません')
      return
    }

    // そのページにテーブルがあるか確認
    const tablesOnPage = tables.filter(t => t.page_number === pageNumber)
    if (tablesOnPage.length > 0) {
      if (!confirm(`ページ${pageNumber}には${tablesOnPage.length}個のテーブルがあります。削除しますか？`)) {
        return
      }
      
      // テーブルを削除
      const storeId = localStorage.getItem('currentStoreId') || '1'
      for (const table of tablesOnPage) {
        await supabase
          .from('table_status')
          .delete()
          .eq('table_name', table.table_name)
          .eq('store_id', storeId)
      }
    }

    setPageCount(prev => Math.max(1, prev - 1))
    if (currentViewPage >= pageNumber) {
      setCurrentViewPage(Math.max(1, currentViewPage - 1))
    }
    
    loadTables()
  }

  // テーブルの表示/非表示を切り替え
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

  // 新規テーブル追加
  const addNewTable = async () => {
    if (!newTableName.trim()) return
    const storeId = localStorage.getItem('currentStoreId') || '1'
    const newTable: TableLayout = {
      table_name: newTableName.trim(),
      display_name: newTableName.trim(),
      position_top: forbiddenZones.top + 50,
      position_left: forbiddenZones.left + 50,
      table_width: tableSize.width,
      table_height: tableSize.height,
      is_visible: true,
      page_number: currentViewPage,  // ⭐ 現在のページに追加
      current_guest: null,
    }

    const { error } = await supabase
      .from('table_status')
      .insert([{
        ...newTable,
        store_id: storeId,
        guest_name: null,
        cast_name: null,
        entry_time: null,
        visit_type: null
      }])

    if (!error) {
      setTables(prev => [...prev, newTable])
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
      setTables(prev => prev.filter(t => t.table_name !== tableName))
    }
  }

  // 画面比率の処理
  const handleRatioChange = (ratio: string) => {
    setSelectedRatio(ratio)
    const preset = presetRatios.find(r => r.label === ratio)
    
    if (preset && preset.width > 0) {
      setCanvasSize({ width: preset.width, height: preset.height })
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
    // 各テーブルのサイズを更新
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

    // ローカルステートも更新
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

  // キャンバスのタッチ/マウス操作（ピンチズーム対応）
  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggedTable) return

    const target = e.target as HTMLElement
    if (target.id === 'canvas-area' || target === canvasRef.current) {
      // タッチイベントの場合
      if ('touches' in e) {
        if (e.touches.length === 2) {
          // ピンチズーム開始
          isPinching.current = true
          lastPinchDistance.current = getPinchDistance(e.touches[0], e.touches[1])
          e.preventDefault()
        } else if (e.touches.length === 1) {
          // パン開始
          isPanning.current = true
          lastPanPoint.current = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
          }
        }
      } else {
        // マウスイベントの場合
        isPanning.current = true
        lastPanPoint.current = { x: e.clientX, y: e.clientY }
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    // タッチイベントの場合
    if ('touches' in e) {
      if (isPinching.current && e.touches.length === 2) {
        // ピンチズーム中
        const currentDistance = getPinchDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / lastPinchDistance.current
        const newZoom = Math.max(0.5, Math.min(3, zoom * scale))
        setZoom(newZoom)
        lastPinchDistance.current = currentDistance
        e.preventDefault()
      } else if (isPanning.current && e.touches.length === 1) {
        // パン中
        const deltaX = e.touches[0].clientX - lastPanPoint.current.x
        const deltaY = e.touches[0].clientY - lastPanPoint.current.y
        
        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }))
        
        lastPanPoint.current = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        }
      }
    } else if (isPanning.current) {
      // マウスでパン中
      const deltaX = e.clientX - lastPanPoint.current.x
      const deltaY = e.clientY - lastPanPoint.current.y
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
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

  // ドラッグ開始（タッチ対応改善）
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, table: TableLayout) => {
    e.stopPropagation()
    if ('touches' in e && e.touches.length > 1) return
    
    // ⭐ ページ番号に応じたキャンバスを取得
    const pageNum = table.page_number || 1
    const canvas = document.getElementById(`canvas-area-${pageNum}`)
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    // ズームとパンを考慮した座標計算
    const actualX = (clientX - rect.left - panOffset.x) / zoom
    const actualY = (clientY - rect.top - panOffset.y) / zoom
    
    setDraggedTable(table.table_name)
    setDragOffset({
      x: actualX - table.position_left,
      y: actualY - table.position_top
    })
    
    // タッチイベントの場合、デフォルト動作を防ぐ
    if ('touches' in e) {
      e.preventDefault()
    }
  }

  // ドラッグ中
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTable) return

    e.preventDefault()

    const canvas = document.getElementById('canvas-area')
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    // ズームとパンを考慮した座標計算
    const actualX = (clientX - rect.left - panOffset.x) / zoom
    const actualY = (clientY - rect.top - panOffset.y) / zoom
    
    const table = tables.find(t => t.table_name === draggedTable)
    if (table) {
      // 配置禁止ゾーンを考慮した制限
      const minX = forbiddenZones.left
      const maxX = canvasSize.width - table.table_width - forbiddenZones.right
      const minY = forbiddenZones.top
      const maxY = canvasSize.height - table.table_height - forbiddenZones.bottom
      
      const newLeft = Math.max(minX, Math.min(actualX - dragOffset.x, maxX))
      const newTop = Math.max(minY, Math.min(actualY - dragOffset.y, maxY))

      setTables(prev => prev.map(t => 
        t.table_name === draggedTable 
          ? { ...t, position_top: newTop, position_left: newLeft }
          : t
      ))
    }
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    if (draggedTable) {
      const table = tables.find(t => t.table_name === draggedTable)
      if (table) {
        updateTablePosition(table.table_name, table.position_top, table.position_left)
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
          <h1 style={{ margin: 0, fontSize: windowWidth <= 768 ? '20px' : '24px' }}>
            🎨 テーブル配置編集
          </h1>
          {/* ⭐ divタグで2つのボタンを囲む */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* ⭐ 自動整列ボタンを追加 */}
            <button
              onClick={() => setShowAlignModal(true)}
              style={{
                padding: windowWidth <= 768 ? '6px 12px' : '8px 16px',
                fontSize: windowWidth <= 768 ? '14px' : '16px',
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
            {/* 既存のホームに戻るボタン */}
            <button
              onClick={() => router.push('/')}
              style={{
                padding: windowWidth <= 768 ? '6px 12px' : '8px 16px',
                fontSize: windowWidth <= 768 ? '14px' : '16px',
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
        
        {/* ⭐ ページコントロール */}
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
          flexDirection: windowWidth <= 768 ? 'column' : 'row'
        }}>
          {/* サイドバー */}
          <div style={{
            width: windowWidth <= 768 ? '100%' : '320px',
            height: windowWidth <= 768 ? 'auto' : 'auto',
            maxHeight: windowWidth <= 768 ? '40vh' : '100%',
            backgroundColor: 'white',
            borderRight: windowWidth <= 768 ? 'none' : '1px solid #ddd',
            borderBottom: windowWidth <= 768 ? '1px solid #ddd' : 'none',
            padding: windowWidth <= 768 ? '15px' : '20px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* 新規テーブル追加 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: windowWidth <= 768 ? '16px' : '18px' }}>新規テーブル追加</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: windowWidth <= 768 ? 'wrap' : 'nowrap' }}>
                <input
                  type="text"
                  placeholder="テーブル名"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: windowWidth <= 768 ? '150px' : 'auto',
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

            {/* 画面比率選択 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: windowWidth <= 768 ? '16px' : '18px' }}>画面比率</h3>
              <select
                value={selectedRatio}
                onChange={(e) => handleRatioChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              >
                {presetRatios.map(ratio => (
                  <option key={ratio.label} value={ratio.label}>
                    {ratio.label}
                  </option>
                ))}
              </select>
              
              {selectedRatio === 'カスタム...' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="number"
                      placeholder="幅"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    <span style={{ alignSelf: 'center' }}>×</span>
                    <input
                      type="number"
                      placeholder="高さ"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <button
                    onClick={applyCustomSize}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    適用
                  </button>
                </div>
              )}
            </div>

            {/* テーブルサイズ設定 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: windowWidth <= 768 ? '16px' : '18px' }}>
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
              <h3 style={{ margin: '0 0 10px 0', fontSize: windowWidth <= 768 ? '16px' : '18px' }}>
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
              <h3 style={{ margin: '0 0 10px 0', fontSize: windowWidth <= 768 ? '16px' : '18px' }}>テーブル一覧</h3>
              <div style={{ maxHeight: windowWidth <= 768 ? '200px' : '400px', overflowY: 'auto' }}>
                {tables.map(table => (
                  <div
                    key={table.table_name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: windowWidth <= 768 ? '6px' : '8px',
                      borderBottom: '1px solid #eee',
                      gap: '8px',
                      fontSize: windowWidth <= 768 ? '14px' : '16px'
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
                        onClick={() => setSelectedTable(table)}  // ← これに変更
                        style={{
                          padding: windowWidth <= 768 ? '3px 6px' : '4px 8px',
                          fontSize: windowWidth <= 768 ? '11px' : '12px',
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
                        padding: windowWidth <= 768 ? '3px 6px' : '4px 8px',
                        fontSize: windowWidth <= 768 ? '11px' : '12px',
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
            onWheel={handleWheel}  // ⭐ これを追加
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#e0e0e0',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              gap: '20px',
              padding: '20px',
              alignItems: 'flex-start'
            }}
          >
            {/* ⭐ 各ページのキャンバス */}
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
                  cursor: draggedTable ? 'grabbing' : 'grab',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'border 0.3s'
                }}
                onMouseDown={(e) => {
                  setCurrentViewPage(pageNum)  // クリックしたページをアクティブに
                  handleCanvasMouseDown(e)
                }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              >
                {/* ページ番号表示 */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 152, 0, 0.8)',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  zIndex: 10
                }}>
                  ページ {pageNum}
                </div>

                {/* 配置禁止ゾーン（既存のコードをそのまま使用） */}
                {/* 上部禁止ゾーン */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${forbiddenZones.top}px`,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderBottom: '2px dashed #ff6b6b',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ 
                    color: '#ff6b6b', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 12px',
                    borderRadius: '4px'
                  }}>
                    ヘッダー領域（配置不可）
                  </span>
                </div>
                
                {/* 下部禁止ゾーン */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${forbiddenZones.bottom}px`,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderTop: '2px dashed #ff6b6b',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ 
                    color: '#ff6b6b', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 12px',
                    borderRadius: '4px'
                  }}>
                    ナビゲーションバー領域（配置不可）
                  </span>
                </div>

                {/* ⭐ そのページのテーブルのみ表示 */}
                {tables
                  .filter(t => t.is_visible && (t.page_number || 1) === pageNum)
                  .map((table) => (
                    <div
                      key={table.table_name}
                      onDoubleClick={() => handleDoubleClick(table)}
                      style={{
                        position: 'absolute',
                        top: `${table.position_top}px`,
                        left: `${table.position_left}px`,
                        width: `${table.table_width}px`,
                        height: `${table.table_height}px`,
                        backgroundColor: table.current_guest ? '#FF9800' : '#ccc',
                        border: `3px solid ${table.current_guest ? '#FF9800' : '#ccc'}`,
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
                      onTouchStart={(e) => handleDragStart(e, table)}
                      onTouchMove={(e) => {
                        e.preventDefault()
                        handleDragMove(e)
                      }}
                      onTouchEnd={handleDragEnd}
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
                    <h3 style={{ margin: '0 0 16px 0' }}>テーブル名編集</h3>
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          if (selectedTable) {
                            updateTableName(selectedTable.table_name, selectedTable.display_name || '')
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setSelectedTable(null)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              )}

        {/* ⭐ 自動整列モーダルを追加 */}
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
              padding: '24px',
              borderRadius: '12px',
              width: windowWidth <= 768 ? '90%' : '500px',
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

                {/* ⭐ 横の間隔（tableSpacingから変更） */}
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

                {/* ⭐ 縦の間隔（新規追加） */}
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

                {/* ⭐ 自動間隔計算ボタンを追加 */}
                <button
                  onClick={() => {
                    // キャンバスサイズとテーブル数から最適な間隔を計算
                    const avgTableWidth = 130  // 平均的なテーブル幅
                    const avgTableHeight = 123 // 平均的なテーブル高さ
                    
                    // 使用可能な領域を計算
                    const usableWidth = canvasSize.width - alignStartX - forbiddenZones.right - 100
                    const usableHeight = canvasSize.height - alignStartY - forbiddenZones.bottom - 100
                    
                    // 最適な間隔を計算
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
                  {/* ⭐ 必要なサイズを追加表示 */}
                  • 必要な横幅: 約{alignCols * 130 + (alignCols - 1) * horizontalSpacing}px<br />
                  • 必要な縦幅: 約{alignRows * 123 + (alignRows - 1) * verticalSpacing}px
                </p>
              </div>

              {/* ⭐ 警告メッセージを追加（必要に応じて表示） */}
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
        onTouchMove={(e) => {
          if (draggedTable) {
            e.preventDefault()
            handleDragMove(e)
          }
        }}
        onTouchEnd={handleDragEnd}
      />
    </>
  )
}