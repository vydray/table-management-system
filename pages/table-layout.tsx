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
  
  // テーブルサイズ関連の状態
  const [tableSize, setTableSize] = useState({ width: 130, height: 123 })
  const [isUpdatingSize, setIsUpdatingSize] = useState(false)
  
  // ズーム関連の状態
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPanPoint = useRef({ x: 0, y: 0 })
  
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
        .order('table_name')

      if (!error && data) {
        setTables(data)
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
      position_top: forbiddenZones.top + 50,  // 配置禁止ゾーンを避けた初期位置
      position_left: forbiddenZones.left + 50,
      table_width: tableSize.width,
      table_height: tableSize.height,
      is_visible: true,
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

  // キャンバスのパン操作
  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggedTable) return

    const target = e.target as HTMLElement
    if (target.id === 'canvas-area') {
      isPanning.current = true
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      lastPanPoint.current = { x: clientX, y: clientY }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPanning.current) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      const deltaX = clientX - lastPanPoint.current.x
      const deltaY = clientY - lastPanPoint.current.y
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      lastPanPoint.current = { x: clientX, y: clientY }
    }
  }

  const handleCanvasMouseUp = () => {
    isPanning.current = false
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
    
    const canvas = document.getElementById('canvas-area')
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
          <h1 style={{ margin: 0, fontSize: windowWidth <= 768 ? '20px' : '24px' }}>🎨 テーブル配置編集</h1>
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
                  onKeyPress={(e) => e.key === 'Enter' && addNewTable()}
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
                      onClick={() => setSelectedTable(table)}
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

          {/* キャンバスエリア */}
          <div
            ref={canvasRef}
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#e0e0e0',
              overflow: 'hidden',
              padding: '20px',
              cursor: isPanning.current ? 'grabbing' : 'grab'
            }}
            onWheel={handleWheel}
          >
            <div
              id="canvas-area"
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                backgroundColor: '#f0f0f0',
                position: 'relative',
                cursor: draggedTable ? 'grabbing' : isPanning.current ? 'grabbing' : 'grab',
                touchAction: 'none',
                transformOrigin: '0 0',
                transform: `scale(${zoom})`,
                transition: 'none',
                userSelect: 'none'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onTouchStart={handleCanvasMouseDown}
              onTouchMove={handleCanvasMouseMove}
              onTouchEnd={handleCanvasMouseUp}
            >
              {/* 配置禁止ゾーンの表示 */}
              {/* 上部禁止ゾーン（ヘッダー領域） */}
              <div
                style={{
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
                }}
              >
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
              
              {/* 下部禁止ゾーン（Androidナビゲーションバー領域） */}
              <div
                style={{
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
                }}
              >
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

              {/* 既存のテーブル描画 */}
              {tables.filter(t => t.is_visible).map((table) => (
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
                >
                  {table.display_name || table.table_name}
                </div>
              ))}
            </div>
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
                  onClick={() => updateTableName(selectedTable.table_name, selectedTable.display_name || '')}
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
      </div>

      {/* グローバルイベントリスナー */}
      <div
        style={{ display: 'none' }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      />
    </>
  )
}