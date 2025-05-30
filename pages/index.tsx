import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'

// テーブルの型定義
interface TableData {
  table: string
  name: string
  oshi: string
  time: string
  visit: string
  elapsed: string
  status: 'empty' | 'occupied'
}

// テーブルの位置情報
const tablePositions = {
  'A1': { top: 607, left: 723 },
  'A2': { top: 607, left: 862 },
  'A3': { top: 479, left: 862 },
  'A4': { top: 351, left: 862 },
  'A5': { top: 223, left: 862 },
  'A6': { top: 223, left: 723 },
  'A7': { top: 223, left: 581 },
  'A8': { top: 223, left: 438 },
  'B1': { top: 85, left: 759 },
  'B2': { top: 84, left: 607 },
  'B3': { top: 84, left: 454 },
  'B4': { top: 84, left: 302 },
  'B5': { top: 84, left: 149 },
  'C1': { top: 230, left: 201 },
  'C2': { top: 230, left: 58 },
  'C3': { top: 358, left: 58 },
  'C4': { top: 486, left: 58 },
  'C5': { top: 614, left: 58 },
  'C6': { top: 614, left: 201 },
  '臨時1': { top: 425, left: 363 },
  '臨時2': { top: 425, left: 505 }
}

export default function Home() {
  const [tables, setTables] = useState<Record<string, TableData>>({})
  const [castList, setCastList] = useState<string[]>([])
  const [currentTable, setCurrentTable] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new')
  const [moveMode, setMoveMode] = useState(false)
  const [moveFromTable, setMoveFromTable] = useState('')
  const [showMoveHint, setShowMoveHint] = useState(false)
  
  // 日本時間を取得する関数
function getJapanTime(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jstTime = new Date(utc + (9 * 60 * 60000));
  return jstTime;
}

  // フォームの状態
  const [formData, setFormData] = useState({
    guestName: '',
    castName: '',
    visitType: '',
    editHour: 0,
    editMinute: 0
  })

  // 長押し用のref
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  // データ取得
  const loadData = async () => {
    try {
      const res = await fetch('/api/tables/status')
      const data: TableData[] = await res.json()
      
      const tableMap: Record<string, TableData> = {}
      
      // 全テーブルの初期状態を作成
      Object.keys(tablePositions).forEach(tableId => {
        tableMap[tableId] = {
          table: tableId,
          name: '',
          oshi: '',
          time: '',
          visit: '',
          elapsed: '',
          status: 'empty'
        }
      })
      
      // 取得したデータで更新
      data.forEach(item => {
        tableMap[item.table] = item
      })
      
      setTables(tableMap)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // キャストリスト取得
  const loadCastList = async () => {
    try {
      const res = await fetch('/api/casts/list')
      const data = await res.json()
      setCastList(data)
    } catch (error) {
      console.error('Error loading cast list:', error)
    }
  }

  // 初期化
  useEffect(() => {
    loadData()
    loadCastList()
    
    // 1分ごとに自動更新
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  // テーブル情報更新
  const updateTableInfo = async () => {
  try {
    // 新規・編集どちらも現在時刻を送る
    let timeStr: string
    
    if (modalMode === 'new') {
      // 新規登録時：現在の正確な時刻を5分単位に丸める
      const now = getJapanTime()  
      const minutes = now.getMinutes()
      const roundedMinutes = Math.round(minutes / 5) * 5
      
      now.setMinutes(roundedMinutes)
      now.setSeconds(0)
      now.setMilliseconds(0)
      
      if (roundedMinutes === 60) {
        now.setMinutes(0)
        now.setHours(now.getHours() + 1)
      }
      
      timeStr = now.toISOString()
    } else {
      // 編集時：選択された時刻
      const selectedTime = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        formData.editHour,
        formData.editMinute
      )
      timeStr = selectedTime.toISOString()
    }

    await fetch('/api/tables/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: currentTable,
        guestName: formData.guestName,
        castName: formData.castName,
        timeStr, // 常に時刻を送る
        visitType: formData.visitType
      })
    })
    
    setShowModal(false)
    loadData()
  } catch (error) {
    console.error('Error updating table:', error)
    alert('更新に失敗しました')
  }
}

  // 会計処理
  const checkout = async () => {
    if (!confirm(`${currentTable} を会計完了にしますか？`)) return
    
    try {
      await fetch('/api/tables/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: currentTable })
      })
      
      setShowModal(false)
      loadData()
    } catch (error) {
      console.error('Error checkout:', error)
      alert('会計処理に失敗しました')
    }
  }

  // テーブルクリア
  const clearTable = async () => {
    if (!confirm(`${currentTable} の情報を削除しますか？`)) return
    
    try {
      await fetch('/api/tables/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: currentTable })
      })
      
      setShowModal(false)
      loadData()
    } catch (error) {
      console.error('Error clearing table:', error)
      alert('削除に失敗しました')
    }
  }

  // 席移動
  const executeMove = async (toTable: string) => {
    try {
      await fetch('/api/tables/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTableId: moveFromTable,
          toTableId: toTable
        })
      })
      
      endMoveMode()
      loadData()
    } catch (error) {
      console.error('Error moving table:', error)
      alert('移動に失敗しました')
      endMoveMode()
    }
  }

  // 長押し開始
  const startMoveMode = (tableId: string) => {
    setMoveMode(true)
    setMoveFromTable(tableId)
    setShowMoveHint(true)
  }

  // 移動モード終了
  const endMoveMode = () => {
    setMoveMode(false)
    setMoveFromTable('')
    setShowMoveHint(false)
    isLongPress.current = false
  }

  // モーダルを開く
const openModal = (table: TableData) => {
  setCurrentTable(table.table)
  
  if (table.status === 'empty') {
    setModalMode('new')
    const japanNow = getJapanTime()  // ← ここを修正
    setFormData({
      guestName: '',
      castName: '',
      visitType: '',
      editHour: japanNow.getHours(),  // ← ここを修正
      editMinute: Math.floor(japanNow.getMinutes() / 5) * 5  // ← ここを修正
    })
  } else {
    setModalMode('edit')
    const time = table.time ? new Date(table.time) : new Date()
    setFormData({
      guestName: table.name,
      castName: table.oshi,
      visitType: table.visit,
      editHour: time.getHours(),
      editMinute: time.getMinutes()
    })
  }
  
  setShowModal(true)
}

  // テーブルコンポーネント
  const Table = ({ tableId, data }: { tableId: string, data: TableData }) => {
    const [startPos, setStartPos] = useState({ x: 0, y: 0, time: 0 })
    
    const handleStart = (x: number, y: number) => {
      setStartPos({ x, y, time: Date.now() })
      
      if (data.status === 'occupied' && !moveMode) {
        longPressTimer.current = setTimeout(() => {
          if (!isLongPress.current) {
            isLongPress.current = true
            startMoveMode(tableId)
          }
        }, 800)
      }
    }
    
    const handleMove = (x: number, y: number) => {
      const moveX = Math.abs(x - startPos.x)
      const moveY = Math.abs(y - startPos.y)
      
      if (moveX > 10 || moveY > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }
    }
    
    const handleEnd = () => {
      const elapsed = Date.now() - startPos.time
      
      if (elapsed < 500 && !isLongPress.current) {
        if (!moveMode) {
          openModal(data)
        } else if (data.status === 'empty') {
          executeMove(tableId)
        }
      }
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      isLongPress.current = false
    }
    
    const position = tablePositions[tableId as keyof typeof tablePositions]
    
    return (
      <div
        className={`table ${data.status} ${
          moveMode && moveFromTable === tableId ? 'lifting' : ''
        } ${
          moveMode && data.status === 'empty' ? 'move-target' : ''
        } ${
          moveMode && data.status === 'occupied' && tableId !== moveFromTable ? 'move-mode' : ''
        }`}
        style={{ top: position.top, left: position.left }}
        onTouchStart={(e) => {
          e.preventDefault()
          const touch = e.touches[0]
          handleStart(touch.clientX, touch.clientY)
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0]
          handleMove(touch.clientX, touch.clientY)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleEnd()
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          handleStart(e.clientX, e.clientY)
        }}
        onMouseMove={(e) => {
          if (longPressTimer.current) {
            handleMove(e.clientX, e.clientY)
          }
        }}
        onMouseUp={(e) => {
          e.preventDefault()
          handleEnd()
        }}
        onMouseLeave={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
        }}
      >
        <div className="table-name">
          {tableId} {data.visit && data.status === 'occupied' ? data.visit : ''}
        </div>
        <div className="table-info">
          {data.status === 'empty' ? (
            <small>空席</small>
          ) : (
            <>
              <strong>{data.name}</strong>
              推し: {data.oshi}
              <div className="table-elapsed">{data.elapsed}</div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>📋 テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div id="layout" onClick={(e) => {
        if (moveMode && e.target === e.currentTarget) {
          endMoveMode()
        }
      }}>
        <div className="header">📋 テーブル管理システム</div>
        
        {showMoveHint && (
          <div id="move-hint">
            🔄 移動先の空席をタップしてください（キャンセル：画面外をタップ）
          </div>
        )}
        
        {Object.entries(tables).map(([tableId, data]) => (
          <Table key={tableId} tableId={tableId} data={data} />
        ))}
      </div>

      {/* モーダルオーバーレイ */}
      {(showModal || showMoveModal) && (
        <div id="modal-overlay" onClick={() => {
          setShowModal(false)
          setShowMoveModal(false)
        }} />
      )}

      {/* メインモーダル */}
      {showModal && (
        <div id="modal">
          <button id="modal-close" onClick={() => setShowModal(false)}>×</button>
          <h3>📌 {currentTable} の操作</h3>

          {modalMode === 'new' ? (
            <div id="form-fields">
              <label>
                お客様名:
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="お客様名を入力"
                />
              </label>
              
              <label>
                推し:
                <select
                  value={formData.castName}
                  onChange={(e) => setFormData({ ...formData, castName: e.target.value })}
                >
                  <option value="">-- 推しを選択 --</option>
                  {castList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              
              <label>
                来店種別:
                <select
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                >
                  <option value="">-- 来店種別を選択 --</option>
                  <option value="初回">初回</option>
                  <option value="再訪">再訪</option>
                  <option value="常連">常連</option>
                </select>
              </label>
              
              <div className="center">
                <button
                  onClick={updateTableInfo}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  決定
                </button>
              </div>
            </div>
          ) : (
            <div id="details">
              <label>
                お客様名:
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                />
              </label>
              
              <label>
                推し:
                <select
                  value={formData.castName}
                  onChange={(e) => setFormData({ ...formData, castName: e.target.value })}
                >
                  <option value="">-- 推しを選択 --</option>
                  {castList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              
              <label>
                来店種別:
                <select
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                >
                  <option value="初回">初回</option>
                  <option value="再訪">再訪</option>
                  <option value="常連">常連</option>
                </select>
              </label>
              
              <label>
                入店時刻:
                <div className="time-row">
                  <select
                    value={formData.editHour}
                    onChange={(e) => setFormData({ ...formData, editHour: Number(e.target.value) })}
                  >
                    {[...Array(24)].map((_, h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={formData.editMinute}
                    onChange={(e) => setFormData({ ...formData, editMinute: Number(e.target.value) })}
                  >
                    {[...Array(12)].map((_, i) => {
                      const m = i * 5
                      return (
                        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                      )
                    })}
                  </select>
                </div>
              </label>
              
              <p className="center" style={{ fontSize: '18px', color: '#666', margin: '15px 0' }}>
                <strong>経過時間: {tables[currentTable]?.elapsed}</strong>
              </p>
              
              <div className="center">
                <button
                  onClick={updateTableInfo}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  保存
                </button>
              </div>
              
              <div className="button-group">
                <button onClick={checkout} className="btn-warning">会計完了</button>
                <button onClick={() => {
                  setShowModal(false)
                  setShowMoveModal(true)
                }} className="btn-primary">席移動</button>
                <button onClick={clearTable} className="btn-danger">削除</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 席移動モーダル */}
      {showMoveModal && (
        <div id="move-modal">
          <button
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
            onClick={() => setShowMoveModal(false)}
          >
            ×
          </button>
          <h3>🔄 席移動</h3>
          <p style={{ margin: '10px 0' }}>
            移動元: <strong>{currentTable}</strong>
          </p>
          <label>
            移動先を選択:
            <select
              id="moveToTable"
              style={{
                width: '100%',
                padding: '8px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              defaultValue=""
            >
              <option value="">-- 移動先を選択 --</option>
              {Object.entries(tables)
                .filter(([id, data]) => id !== currentTable && data.status === 'empty')
                .map(([id]) => (
                  <option key={id} value={id}>{id}</option>
                ))
              }
            </select>
          </label>
          <div className="button-group">
            <button
              onClick={() => {
                const select = document.getElementById('moveToTable') as HTMLSelectElement
                const toTable = select.value
                if (!toTable) {
                  alert('移動先を選択してください')
                  return
                }
                if (confirm(`${currentTable} から ${toTable} へ移動しますか？`)) {
                  fetch('/api/tables/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fromTableId: currentTable,
                      toTableId: toTable
                    })
                  })
                    .then(() => {
                      setShowMoveModal(false)
                      loadData()
                    })
                    .catch((error) => {
                      alert('移動に失敗しました')
                      console.error(error)
                    })
                }
              }}
              className="btn-primary"
            >
              移動実行
            </button>
            <button
              onClick={() => setShowMoveModal(false)}
              style={{
                backgroundColor: '#ccc',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        :global(html, body) {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #fff;
          font-family: sans-serif;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        #layout {
          position: relative;
          width: 1024px;
          height: 768px;
          margin: auto;
          background: #f8f8f8;
          border: 1px solid #ccc;
        }

        .table {
          width: 130px;
          height: 123px;
          background: #fff;
          border: 2px solid #707070;
          border-radius: 16px;
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          padding: 5px;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .table:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .table.lifting {
          transform: scale(1.1) translateY(-10px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
          z-index: 100;
          border: 3px solid #4CAF50;
          animation: pulse 1s infinite;
        }

        .table.empty.move-target {
          border: 3px dashed #4CAF50;
          animation: blink 1s infinite;
        }

        .table.occupied.move-mode {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes pulse {
          0% { transform: scale(1.1) translateY(-10px); }
          50% { transform: scale(1.15) translateY(-15px); }
          100% { transform: scale(1.1) translateY(-10px); }
        }

        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .empty {
          background-color: #eeeeee;
        }

        .occupied {
          background-color: #ffe0f0;
        }

        .header {
          position: absolute;
          top: 0;
          left: 0;
          width: 1024px;
          height: 72px;
          background-color: #b9f6b7;
          border: 1px solid #707070;
          text-align: center;
          line-height: 72px;
          font-size: 32px;
          font-weight: bold;
        }

        .table-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .table-info {
          font-size: 12px;
          text-align: center;
          line-height: 1.4;
        }

        .table-info strong {
          display: block;
          margin: 2px 0;
        }

        .table-elapsed {
          font-size: 11px;
          color: #666;
          margin-top: 5px;
        }

        #move-hint {
          display: block;
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #4CAF50;
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 200;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        #modal-overlay {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          z-index: 998;
        }

        #modal, #move-modal {
          display: block;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 2px solid #ccc;
          padding: 20px;
          box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
          border-radius: 10px;
          z-index: 999;
          width: 320px;
        }

        #modal input, #modal select {
          margin-bottom: 10px;
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        #modal button {
          padding: 8px 16px;
          margin-top: 5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        #modal button:hover {
          opacity: 0.8;
        }

        .btn-primary {
          background-color: #4CAF50;
          color: white;
        }

        .btn-warning {
          background-color: #ff9800;
          color: white;
        }

        .btn-danger {
          background-color: #f44336;
          color: white;
        }

        .time-row {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .center {
          text-align: center;
        }

        #modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        #modal-close:hover {
          color: #000;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .button-group button {
          flex: 1;
        }
      `}</style>
    </>
  )
}