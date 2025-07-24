// pages/table-layout.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
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
  const lastPanPosition = useRef({ x: 0, y: 0 })
  const pinchStartDistance = useRef(0)
  const startZoom = useRef(1)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchTables()
    
    // 保存された画面比率を読み込む
    const savedRatio = localStorage.getItem('tableLayoutRatio')
    const savedCustomWidth = localStorage.getItem('tableLayoutCustomWidth')
    const savedCustomHeight = localStorage.getItem('tableLayoutCustomHeight')
    
    if (savedRatio) {
      setSelectedRatio(savedRatio)
      if (savedRatio === 'カスタム...' && savedCustomWidth && savedCustomHeight) {
        setCustomWidth(savedCustomWidth)
        setCustomHeight(savedCustomHeight)
        setCanvasSize({ 
          width: parseInt(savedCustomWidth), 
          height: parseInt(savedCustomHeight) 
        })
      } else {
        const preset = presetRatios.find(r => r.label === savedRatio)
        if (preset) {
          setCanvasSize({ width: preset.width, height: preset.height })
        }
      }
    }
    
    // 保存されたテーブルサイズを読み込む
    const savedTableWidth = localStorage.getItem('tableWidth')
    const savedTableHeight = localStorage.getItem('tableHeight')
    if (savedTableWidth && savedTableHeight) {
      setTableSize({
        width: parseInt(savedTableWidth),
        height: parseInt(savedTableHeight)
      })
    }
  }, [])

  // ピンチズーム処理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // ピンチ開始
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      pinchStartDistance.current = distance
      startZoom.current = zoom
    } else if (e.touches.length === 1 && !draggedTable) {
      // パン開始
      isPanning.current = true
      lastPanPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // ピンチ中
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      if (pinchStartDistance.current > 0) {
        const scale = distance / pinchStartDistance.current
        const newZoom = Math.max(0.5, Math.min(3, startZoom.current * scale))
        setZoom(newZoom)
      }
    } else if (e.touches.length === 1 && isPanning.current && !draggedTable) {
      // パン中
      const deltaX = e.touches[0].clientX - lastPanPosition.current.x
      const deltaY = e.touches[0].clientY - lastPanPosition.current.y
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      lastPanPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }
  }

  const handleTouchEnd = () => {
    isPanning.current = false
    pinchStartDistance.current = 0
  }

  // マウスホイールでのズーム
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta))
    setZoom(newZoom)
  }

  // 画面比率の変更処理
  const handleRatioChange = (value: string) => {
    setSelectedRatio(value)
    localStorage.setItem('tableLayoutRatio', value)
    
    if (value !== 'カスタム...') {
      const preset = presetRatios.find(r => r.label === value)
      if (preset) {
        setCanvasSize({ width: preset.width, height: preset.height })
      }
    }
  }

  // カスタムサイズの適用
  const applyCustomSize = () => {
    const width = parseInt(customWidth)
    const height = parseInt(customHeight)
    
    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      setCanvasSize({ width, height })
      localStorage.setItem('tableLayoutCustomWidth', customWidth)
      localStorage.setItem('tableLayoutCustomHeight', customHeight)
    }
  }

  // テーブル一覧の取得
  const fetchTables = useCallback(async () => {
    setLoading(true)
    try {
      const savedStoreId = localStorage.getItem('currentStoreId') || '1'
      const { data, error } = await supabase
        .from('table_status')
        .select('*')
        .eq('store_id', savedStoreId)
        .order('table_name')

      if (!error && data) {
        setTables(data)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // テーブルの位置を更新
  const updateTablePosition = async (tableName: string, top: number, left: number) => {
    const savedStoreId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .update({ position_top: top, position_left: left })
      .eq('table_name', tableName)
      .eq('store_id', savedStoreId)

    if (!error) {
      setTables(prev => prev.map(t => 
        t.table_name === tableName ? { ...t, position_top: top, position_left: left } : t
      ))
    }
  }

  // テーブルの表示/非表示を切り替え
  const toggleTableVisibility = async (tableName: string, isVisible: boolean) => {
    const savedStoreId = localStorage.getItem('currentStoreId') || '1'
    const { error } = await supabase
      .from('table_status')
      .update({ is_visible: isVisible })
      .eq('table_name', tableName)
      .eq('store_id', savedStoreId)

    if (!error) {
      setTables(prev => prev.map(t => 
        t.table_name === tableName ? { ...t, is_visible: isVisible } : t
      ))
    }
  }

  // テーブル名を更新
  const updateTableName = async (tableName: string, displayName: string) => {
    const savedStoreId = localStorage.getItem('currentStoreId') || '1'
    
    const { error } = await supabase
      .from('table_status')
      .update({ display_name: displayName || null })
      .eq('table_name', tableName)
      .eq('store_id', savedStoreId)

    if (!error) {
      setTables(prev => prev.map(t => 
        t.table_name === tableName ? { ...t, display_name: displayName || null } : t
      ))
      setSelectedTable(null)
    }
  }

  // 新しいテーブルを追加
  const addNewTable = async () => {
    if (!newTableName.trim()) return

    const savedStoreId = localStorage.getItem('currentStoreId') || '1'
    
    const isDuplicate = tables.some(t => t.table_name === newTableName.trim())
    if (isDuplicate) {
      alert('このテーブル名は既に存在します')
      return
    }

    const { error } = await supabase
      .from('table_status')
      .insert({
        table_name: newTableName,
        store_id: savedStoreId,
        position_top: 300,
        position_left: 400,
        table_width: tableSize.width,
        table_height: tableSize.height,
        is_visible: true
      })

    if (!error) {
      fetchTables()
      setNewTableName('')
    }
  }

  // テーブルサイズの一括更新
  const updateAllTableSizes = async () => {
    setIsUpdatingSize(true)
    const savedStoreId = localStorage.getItem('currentStoreId') || '1'
    
    try {
      // 各テーブルのサイズを更新
      const updatePromises = tables.map(table => 
        supabase
          .from('table_status')
          .update({ 
            table_width: tableSize.width, 
            table_height: tableSize.height 
          })
          .eq('table_name', table.table_name)
          .eq('store_id', savedStoreId)
      )
      
      await Promise.all(updatePromises)
      
      // ローカルの状態も更新
      setTables(prev => prev.map(t => ({
        ...t,
        table_width: tableSize.width,
        table_height: tableSize.height
      })))
      
      // 設定を保存
      localStorage.setItem('tableWidth', tableSize.width.toString())
      localStorage.setItem('tableHeight', tableSize.height.toString())
      
      alert('全テーブルのサイズを更新しました')
    } catch (error) {
      console.error('Error updating table sizes:', error)
      alert('サイズの更新に失敗しました')
    } finally {
      setIsUpdatingSize(false)
    }
  }

  // テーブルを削除
  const deleteTable = async (tableName: string) => {
    if (!confirm('このテーブルを削除しますか？')) return

    const savedStoreId = localStorage.getItem('currentStoreId') || '1'
    
    const { error } = await supabase
      .from('table_status')
      .delete()
      .eq('table_name', tableName)
      .eq('store_id', savedStoreId)

    if (!error) {
      setTables(prev => prev.filter(t => t.table_name !== tableName))
      setSelectedTable(null)
    }
  }

  // ドラッグ開始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, table: TableLayout) => {
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
      const newLeft = Math.max(0, Math.min(actualX - dragOffset.x, canvasSize.width - table.table_width))
      const newTop = Math.max(0, Math.min(actualY - dragOffset.y, canvasSize.height - table.table_height))

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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  <span>×</span>
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
                  <button
                    onClick={applyCustomSize}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    適用
                  </button>
                </div>
              )}
            </div>

            {/* テーブルサイズ（全体） */}
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* ズームコントロール */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 100
            }}>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                ズーム: {Math.round(zoom * 100)}%
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  −
                </button>
                <button
                  onClick={() => setZoom(1)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  100%
                </button>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div
              id="canvas-area"
              style={{
                position: 'relative',
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: '2px solid #333',
                margin: 'auto',
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                transformOrigin: '0 0',
                transition: draggedTable ? 'none' : 'transform 0.1s ease-out'
              }}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              {/* サイズ表示 */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '0',
                fontSize: '14px',
                color: '#666',
                fontWeight: 'bold'
              }}>
                {canvasSize.width} × {canvasSize.height}px
              </div>
              
              {tables.filter(t => t.is_visible).map(table => (
                <div
                  key={table.table_name}
                  style={{
                    position: 'absolute',
                    top: `${table.position_top}px`,
                    left: `${table.position_left}px`,
                    width: `${table.table_width}px`,
                    height: `${table.table_height}px`,
                    backgroundColor: 'white',
                    border: `2px solid ${draggedTable === table.table_name ? '#FF9800' : '#ccc'}`,
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
    </>
  )
}