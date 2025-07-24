import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TableLayout {
  table_name: string
  display_name: string | null
  position_top: number
  position_left: number
  table_width: number
  table_height: number
  is_visible: boolean
  store_id: number
  guest_name?: string | null
  cast_name?: string | null
  entry_time?: string | null
  visit_type?: string | null
}

export default function TableLayout() {
  const router = useRouter()
  const [tables, setTables] = useState<TableLayout[]>([])
  const [selectedTable, setSelectedTable] = useState<TableLayout | null>(null)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [newTableName, setNewTableName] = useState('')
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(1024) // 追加
  const storeId = getCurrentStoreId()

  // ウィンドウサイズの監視
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    // 初期値設定
    setWindowWidth(window.innerWidth)
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // テーブル一覧の取得
  const fetchTables = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('table_status')
        .select('table_name, display_name, position_top, position_left, table_width, table_height, is_visible, store_id')
        .eq('store_id', storeId)
        .order('table_name')

      if (!error && data) {
        setTables(data)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  // テーブルの位置を更新
  const updateTablePosition = async (tableName: string, top: number, left: number) => {
    const { error } = await supabase
      .from('table_status')
      .update({ position_top: top, position_left: left })
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.map(t => 
        t.table_name === tableName ? { ...t, position_top: top, position_left: left } : t
      ))
    }
  }

  // テーブルの表示/非表示を切り替え
  const toggleTableVisibility = async (tableName: string, isVisible: boolean) => {
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

  // テーブル名を更新
  const updateTableName = async (tableName: string, displayName: string) => {
    const { error } = await supabase
      .from('table_status')
      .update({ display_name: displayName || null })
      .eq('table_name', tableName)
      .eq('store_id', storeId)

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

    // 既存のテーブル名と重複しないかチェック
    const isDuplicate = tables.some(t => t.table_name === newTableName.trim())
    if (isDuplicate) {
      alert('このテーブル名は既に存在します')
      return
    }

    const { error } = await supabase
      .from('table_status')
      .insert({
        table_name: newTableName,
        store_id: storeId,
        position_top: 300,
        position_left: 400,
        table_width: 130,
        table_height: 123,
        is_visible: true
      })

    if (!error) {
      fetchTables()
      setNewTableName('')
    }
  }

  // テーブルを削除
  const deleteTable = async (tableName: string) => {
    if (!confirm('このテーブルを削除しますか？')) return

    const { error } = await supabase
      .from('table_status')
      .delete()
      .eq('table_name', tableName)
      .eq('store_id', storeId)

    if (!error) {
      setTables(prev => prev.filter(t => t.table_name !== tableName))
      setSelectedTable(null)
    }
  }

  // ドラッグ開始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, table: TableLayout) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDraggedTable(table.table_name)
    setDragOffset({
      x: clientX - table.position_left,
      y: clientY - table.position_top
    })
  }

  // ドラッグ中
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTable) return

    e.preventDefault() // タッチスクロールを防ぐ

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const table = tables.find(t => t.table_name === draggedTable)
    if (table) {
      const newTop = clientY - dragOffset.y - 72 // ヘッダー分を引く
      const newLeft = clientX - dragOffset.x

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
            width: windowWidth <= 768 ? '100%' : '300px',
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

            {/* 使い方説明 */}
            <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>使い方</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>テーブルをドラッグして移動</li>
                <li>チェックボックスで表示/非表示</li>
                <li>編集ボタンで表示名を変更</li>
                <li>削除ボタンでテーブルを削除</li>
              </ul>
            </div>
            
            {loading && <div style={{ textAlign: 'center', marginTop: '20px' }}>読み込み中...</div>}
          </div>

          {/* キャンバスエリア */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#f9f9f9',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              minHeight: windowWidth <= 768 ? '300px' : 'auto'
            }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* スマホ・タブレット用のスクロールヒント */}
            {windowWidth <= 768 && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 10
              }}>
                ← スクロールして全体を表示 →
              </div>
            )}
            
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
                  border: `2px solid ${draggedTable === table.table_name ? '#FF9800' : '#4CAF50'}`,
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
                  fontSize: windowWidth <= 768 ? '14px' : '16px',
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