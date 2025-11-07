import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// カスタムフック
import { useTableLayout } from '../hooks/useTableLayout'
import { useTableAlignment } from '../hooks/useTableAlignment'
import { useTableDragDrop } from '../hooks/useTableDragDrop'
import { useAutoScale } from '../hooks/useAutoScale'

// スタイル
import {
  headerStyle,
  backButtonStyle,
  headerTitleStyle
} from '../styles/settingsStyles'

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

export default function TableLayoutEdit() {
  const router = useRouter()

  // ローカルstate
  const [selectedTable, setSelectedTable] = useState<TableLayout | null>(null)
  const [newTableName, setNewTableName] = useState('')
  const [currentViewPage, setCurrentViewPage] = useState(1)
  const [tableSize, setTableSize] = useState({ width: 130, height: 123 })
  const [tableSizeInput, setTableSizeInput] = useState({ width: '130', height: '123' })
  const [isUpdatingSize, setIsUpdatingSize] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // 画面比率関連の状態
  const canvasSize = { width: 2176, height: 1600 }
  const autoScale = useAutoScale(canvasRef, canvasSize)

  // 配置禁止ゾーン（ヘッダー160px + ナビゲーションバー60px）
  const forbiddenZones = {
    top: 160,
    bottom: 60,
    left: 0,
    right: 0
  }

  // カスタムフック - テーブル管理
  const {
    tables,
    setTables,
    loading,
    pageCount,
    loadTables,
    addNewTable,
    deleteTable,
    toggleTableVisibility,
    updateTableDisplayName,
    updateAllTableSizes,
    addPage,
    deletePage,
    saveAllTablePositions
  } = useTableLayout()

  // カスタムフック - テーブル整列
  const {
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
    executeAlignment
  } = useTableAlignment()

  // カスタムフック - ドラッグ＆ドロップ
  const {
    draggedTable,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  } = useTableDragDrop()

  // テーブルデータの読み込み
  useEffect(() => {
    const initTables = async () => {
      const data = await loadTables()
      // 最初のテーブルのサイズを初期値として設定
      if (data && data.length > 0) {
        const firstTable = data[0]
        const width = firstTable.table_width || 130
        const height = firstTable.table_height || 123
        setTableSize({ width, height })
        setTableSizeInput({ width: width.toString(), height: height.toString() })
      }
    }
    initTables()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 整列設定が変更されたら入力欄も同期
  useEffect(() => {
    setAlignColsInput(alignCols.toString())
    setAlignRowsInput(alignRows.toString())
    setHorizontalSpacingInput(horizontalSpacing.toString())
    setVerticalSpacingInput(verticalSpacing.toString())
    setAlignStartXInput(alignStartX.toString())
    setAlignStartYInput(alignStartY.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignCols, alignRows, horizontalSpacing, verticalSpacing, alignStartX, alignStartY])

  // 新規テーブル追加ハンドラー
  const handleAddNewTable = async () => {
    const success = await addNewTable(newTableName, currentViewPage, tableSize)
    if (success) {
      setNewTableName('')
    }
  }

  // テーブル表示名更新ハンドラー
  const handleUpdateTableDisplayName = async () => {
    if (!selectedTable) return
    const success = await updateTableDisplayName(selectedTable)
    if (success) {
      setSelectedTable(null)
    }
  }


  // 自動整列を実行ハンドラー
  const handleExecuteAlignment = async () => {
    const alignedTables = await executeAlignment(tables, currentViewPage, canvasSize, forbiddenZones)
    if (alignedTables.length > 0) {
      setTables(prev => prev.map(t => {
        const aligned = alignedTables.find(at => at.table_name === t.table_name)
        return aligned ? aligned : t
      }))
    }
  }

  // 全テーブルのサイズを更新ハンドラー
  const handleUpdateAllTableSizes = async () => {
    setIsUpdatingSize(true)
    await updateAllTableSizes(tableSize)
    setIsUpdatingSize(false)
  }

  // 保存ボタンハンドラー
  const handleSaveChanges = async () => {
    setIsSaving(true)
    const success = await saveAllTablePositions()
    setIsSaving(false)

    if (success) {
      setHasUnsavedChanges(false)
      alert('保存しました')
    } else {
      alert('保存に失敗しました')
    }
  }

  // 戻るボタンハンドラー
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('保存されていない変更があります。破棄してもよろしいですか？')) {
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }

  // ダブルクリックで編集
  const handleDoubleClick = (table: TableLayout) => {
    setSelectedTable(table)
  }

  // キャンバスのイベントハンドラー（空実装）
  const handleCanvasMouseDown = () => {
    // ページクリックのみ対応
  }

  const handleCanvasMouseMove = () => {
    // 何もしない
  }

  const handleCanvasMouseUp = () => {
    // 何もしない
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
        <div style={headerStyle}>
          <button onClick={handleBack} style={backButtonStyle}>
            ←
          </button>
          <h1 style={{ ...headerTitleStyle, flex: 1 }}>
            🎨 テーブル配置編集{hasUnsavedChanges && ' *'}
          </h1>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasUnsavedChanges}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: hasUnsavedChanges ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: hasUnsavedChanges && !isSaving ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              marginRight: '8px'
            }}
          >
            {isSaving ? '保存中...' : '💾 保存'}
          </button>
          <button
            onClick={() => {
              // モーダルを開く際に現在の値を入力欄にセット
              setAlignColsInput(alignCols.toString())
              setAlignRowsInput(alignRows.toString())
              setHorizontalSpacingInput(horizontalSpacing.toString())
              setVerticalSpacingInput(verticalSpacing.toString())
              setAlignStartXInput(alignStartX.toString())
              setAlignStartYInput(alignStartY.toString())
              setShowAlignModal(true)
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: 'white',
              color: '#FF9800',
              border: '2px solid white',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            ⚡ 自動整列
          </button>
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
            onClick={() => {
              addPage()
              setCurrentViewPage(pageCount + 1)
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
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
                  onClick={handleAddNewTable}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
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
                  type="text"
                  inputMode="numeric"
                  value={tableSizeInput.width}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setTableSizeInput({ ...tableSizeInput, width: val })
                  }}
                  onBlur={() => {
                    const val = tableSizeInput.width === '' ? 130 : parseInt(tableSizeInput.width)
                    setTableSize({ ...tableSize, width: val })
                    setTableSizeInput({ ...tableSizeInput, width: val.toString() })
                  }}
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
                  type="text"
                  inputMode="numeric"
                  value={tableSizeInput.height}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setTableSizeInput({ ...tableSizeInput, height: val })
                  }}
                  onBlur={() => {
                    const val = tableSizeInput.height === '' ? 123 : parseInt(tableSizeInput.height)
                    setTableSize({ ...tableSize, height: val })
                    setTableSizeInput({ ...tableSizeInput, height: val.toString() })
                  }}
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
                onClick={handleUpdateAllTableSizes}
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

            {/* 表示倍率情報 */}
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                表示倍率: {Math.round(autoScale * 100)}% (自動調整)
              </p>
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
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
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

          {/* キャンバスエリア - 全体が見える固定スケール、横スクロール対応 */}
          <div
            ref={canvasRef}
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#e0e0e0',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '20px',
              gap: '20px'
            }}
          >
            {/* 全ページを横並びで表示 */}
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
              <div
                key={pageNum}
                id={`canvas-area-${pageNum}`}
                style={{
                  minWidth: `${canvasSize.width * autoScale}px`,
                  width: `${canvasSize.width * autoScale}px`,
                  height: `${canvasSize.height * autoScale}px`,
                  backgroundColor: '#f0f0f0',
                  border: currentViewPage === pageNum ? '3px solid #FF9800' : '2px solid #ccc',
                  borderRadius: '8px',
                  position: 'relative',
                  cursor: draggedTable ? 'grabbing' : 'default',
                  flexShrink: 0
                }}
                onClick={() => setCurrentViewPage(pageNum)}
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
                  top: `${10 * autoScale}px`,
                  left: `${10 * autoScale}px`,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: `${4 * autoScale}px ${12 * autoScale}px`,
                  borderRadius: `${4 * autoScale}px`,
                  fontSize: `${14 * autoScale}px`,
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
                  height: `${forbiddenZones.top * autoScale}px`,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderBottom: `${2 * autoScale}px dashed #ff0000`,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${12 * autoScale}px`,
                  color: '#ff0000'
                }}>
                  ヘッダーエリア（配置不可）
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${forbiddenZones.bottom * autoScale}px`,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderTop: `${2 * autoScale}px dashed #ff0000`,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${12 * autoScale}px`,
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
                        top: `${table.position_top * autoScale}px`,
                        left: `${table.position_left * autoScale}px`,
                        width: `${(table.table_width || 130) * autoScale}px`,
                        height: `${(table.table_height || 123) * autoScale}px`,
                        backgroundColor: table.current_guest ? '#ffe0f0' : table.guest_name ? '#FF9800' : '#ccc',
                        borderRadius: `${8 * autoScale}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'move',
                        userSelect: 'none',
                        boxShadow: draggedTable === table.table_name
                          ? `0 ${4 * autoScale}px ${16 * autoScale}px rgba(0,0,0,0.3)`
                          : `0 ${2 * autoScale}px ${8 * autoScale}px rgba(0,0,0,0.1)`,
                        opacity: draggedTable === table.table_name ? 0.8 : 1,
                        transition: 'box-shadow 0.2s',
                        fontSize: `${16 * autoScale}px`,
                        fontWeight: 'bold',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        const element = e.currentTarget as HTMLElement
                        handleDragStart(table.table_name, e, element)
                      }}
                      onMouseUp={() => handleDragEnd(tables)}
                      onTouchStart={(e) => {
                        const element = e.currentTarget as HTMLElement
                        handleDragStart(table.table_name, e, element)
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault()
                        handleDragMove(e, autoScale, canvasRef.current, tables, setTables)
                        setHasUnsavedChanges(true)
                      }}
                      onTouchEnd={() => handleDragEnd(tables)}
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
          <div
            onClick={() => setSelectedTable(null)}
            style={{
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
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                minWidth: '300px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
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
                  onClick={handleUpdateTableDisplayName}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  保存
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'white',
                    color: '#FF9800',
                    border: '2px solid #FF9800',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
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
          <div
            onClick={() => setShowAlignModal(false)}
            style={{
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
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                width: '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
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
                    type="text"
                    inputMode="numeric"
                    value={alignColsInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setAlignColsInput(val)
                    }}
                    onBlur={() => {
                      const val = alignColsInput === '' ? 1 : Math.max(1, Math.min(10, parseInt(alignColsInput)))
                      setAlignCols(val)
                      setAlignColsInput(val.toString())
                    }}
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
                    type="text"
                    inputMode="numeric"
                    value={alignRowsInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setAlignRowsInput(val)
                    }}
                    onBlur={() => {
                      const val = alignRowsInput === '' ? 1 : Math.max(1, Math.min(10, parseInt(alignRowsInput)))
                      setAlignRows(val)
                      setAlignRowsInput(val.toString())
                    }}
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
                    type="text"
                    inputMode="numeric"
                    value={horizontalSpacingInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setHorizontalSpacingInput(val)
                    }}
                    onBlur={() => {
                      const val = horizontalSpacingInput === '' ? 50 : Math.max(10, Math.min(200, parseInt(horizontalSpacingInput)))
                      setHorizontalSpacing(val)
                      setHorizontalSpacingInput(val.toString())
                    }}
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
                    type="text"
                    inputMode="numeric"
                    value={verticalSpacingInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setVerticalSpacingInput(val)
                    }}
                    onBlur={() => {
                      const val = verticalSpacingInput === '' ? 40 : Math.max(10, Math.min(200, parseInt(verticalSpacingInput)))
                      setVerticalSpacing(val)
                      setVerticalSpacingInput(val.toString())
                    }}
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
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
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
                      type="text"
                      inputMode="numeric"
                      value={alignStartXInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setAlignStartXInput(val)
                      }}
                      onBlur={() => {
                        const val = alignStartXInput === '' ? 0 : Math.max(0, Math.min(500, parseInt(alignStartXInput)))
                        setAlignStartX(val)
                        setAlignStartXInput(val.toString())
                      }}
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
                      type="text"
                      inputMode="numeric"
                      value={alignStartYInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setAlignStartYInput(val)
                      }}
                      onBlur={() => {
                        const val = alignStartYInput === '' ? forbiddenZones.top : Math.max(forbiddenZones.top, Math.min(500, parseInt(alignStartYInput)))
                        setAlignStartY(val)
                        setAlignStartYInput(val.toString())
                      }}
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
                  onClick={handleExecuteAlignment}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
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
                    backgroundColor: 'white',
                    color: '#FF9800',
                    border: '2px solid #FF9800',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
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
        onMouseMove={(e) => {
          handleDragMove(e, autoScale, canvasRef.current, tables, setTables)
          if (draggedTable) setHasUnsavedChanges(true)
        }}
        onMouseUp={() => handleDragEnd(tables)}
        onMouseLeave={() => handleDragEnd(tables)}
        onTouchMove={(e) => {
          if (draggedTable) {
            e.preventDefault()
            handleDragMove(e, autoScale, canvasRef.current, tables, setTables)
            setHasUnsavedChanges(true)
          }
        }}
        onTouchEnd={() => handleDragEnd(tables)}
        onTouchCancel={() => handleDragEnd(tables)}
      />
    </>
  )
}