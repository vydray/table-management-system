import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
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

// 商品の型定義
interface ProductItem {
  id: number
  price: number
  needsCast: boolean
  discountRate: number
}

// 商品カテゴリーの型定義
interface ProductCategories {
  [category: string]: {
    [subcategory: string]: ProductItem
  }
}

// DBから取得する商品カテゴリーの型
interface ProductCategory {
  id: number
  name: string
  display_order: number
}

// DBから取得する商品の型
interface Product {
  id: number
  category_id: number
  name: string
  price: number
  tax_rate: number
  discount_rate: number
  needs_cast: boolean
  is_active: boolean
  display_order: number
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
  'B1': { top: 85, left: 858 },
  'B2': { top: 84, left: 705 },
  'B3': { top: 84, left: 552 },
  'B4': { top: 84, left: 399 },
  'B5': { top: 84, left: 246 },
  'B6': { top: 84, left: 93 },
  'C1': { top: 230, left: 201 },
  'C2': { top: 230, left: 58 },
  'C3': { top: 358, left: 58 },
  'C4': { top: 486, left: 58 },
  'C5': { top: 614, left: 58 },
  '臨時1': { top: 425, left: 363 },
  '臨時2': { top: 425, left: 505 }
}

export default function Home() {
  const router = useRouter()
  const [tables, setTables] = useState<Record<string, TableData>>({})
  const [castList, setCastList] = useState<string[]>([])
  const [currentTable, setCurrentTable] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new')
  const [moveMode, setMoveMode] = useState(false)
  const [moveFromTable, setMoveFromTable] = useState('')
  const [showMoveHint, setShowMoveHint] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isMoving, setIsMoving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  // POS機能用の状態
  const [productCategories, setProductCategories] = useState<ProductCategories>({})
  const [selectedCategory, setSelectedCategory] = useState('')
  const [orderItems, setOrderItems] = useState<Array<{
    name: string
    cast?: string
    quantity: number
    price: number
  }>>([])

  // フォームの状態
  const [formData, setFormData] = useState({
    guestName: '',
    castName: '',
    visitType: '',
    editYear: new Date().getFullYear(),
    editMonth: new Date().getMonth() + 1,
    editDate: new Date().getDate(),
    editHour: 0,
    editMinute: 0
  })

  // 商品データをAPIから取得
  const loadProducts = async () => {
    try {
      console.log('商品データ読み込み開始...')
      
      const res = await fetch('/api/products')
      const data = await res.json()
      
      console.log('APIレスポンス:', data)
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }
      
      const { categories, products } = data
      
      // データ構造を変換
      const productData: ProductCategories = {}
      
      categories?.forEach((category: ProductCategory) => {
        productData[category.name] = {}
        
        products?.filter((p: Product) => p.category_id === category.id)
          .forEach((product: Product) => {
            productData[category.name][product.name] = {
              id: product.id,
              price: product.price,
              needsCast: product.needs_cast,
              discountRate: product.discount_rate
            }
          })
      })
      
      console.log('変換後のデータ:', productData)
      setProductCategories(productData)
    } catch (error) {
      console.error('Error loading products:', error)
      alert('商品データの読み込みに失敗しました')
    }
  }

  // 商品を直接注文に追加（タップで追加）
  const addProductToOrder = (productName: string, price: number, needsCast: boolean, castName?: string) => {
    if (needsCast && !castName) {
      alert('キャストを選択してください')
      return
    }
    
    const newItem = {
      name: productName,
      cast: needsCast ? castName : undefined,
      quantity: 1,
      price: price
    }
    
    setOrderItems([...orderItems, newItem])
  }

  // 合計金額を計算
  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = Math.floor(subtotal * 0.15)
    return { subtotal, tax, total: subtotal + tax }
  }

  // 長押し用のref
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  // 日本時間をYYYY-MM-DD HH:mm:ss形式で取得する関数
  const getJapanTimeString = (date: Date): string => {
    const japanTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
    
    const year = japanTime.getFullYear()
    const month = String(japanTime.getMonth() + 1).padStart(2, '0')
    const day = String(japanTime.getDate()).padStart(2, '0')
    const hours = String(japanTime.getHours()).padStart(2, '0')
    const minutes = String(japanTime.getMinutes()).padStart(2, '0')
    const seconds = String(japanTime.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

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
        if (item.time && item.status === 'occupied') {
          const entryTime = new Date(item.time.replace(' ', 'T'))
          const now = new Date()
          
          // 日付をまたぐ場合の経過時間計算
          let elapsedMin = Math.floor((now.getTime() - entryTime.getTime()) / 60000)
          
          // 負の値になった場合（日付設定ミスなど）は0にする
          if (elapsedMin < 0) {
            elapsedMin = 0
          }
          
          // 24時間以上の場合は時間表示も追加
          let elapsedText = ''
          if (elapsedMin >= 1440) { // 24時間以上
            const days = Math.floor(elapsedMin / 1440)
            const hours = Math.floor((elapsedMin % 1440) / 60)
            const mins = elapsedMin % 60
            elapsedText = `${days}日${hours}時間${mins}分`
          } else if (elapsedMin >= 60) { // 1時間以上
            const hours = Math.floor(elapsedMin / 60)
            const mins = elapsedMin % 60
            elapsedText = `${hours}時間${mins}分`
          } else {
            elapsedText = `${elapsedMin}分`
          }
          
          tableMap[item.table] = {
            ...item,
            elapsed: elapsedText
          }
        } else {
          tableMap[item.table] = item
        }
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
    loadProducts() // 商品データを読み込み
    
    const updateTime = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const date = String(now.getDate()).padStart(2, '0')
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      setCurrentTime(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`)
    }
    
    updateTime()
    
    const timeInterval = setInterval(updateTime, 1000)
    const dataInterval = setInterval(loadData, 10000)
    
    return () => {
      clearInterval(timeInterval)
      clearInterval(dataInterval)
    }
  }, [])

  // フォームデータが変更されたら自動保存
  useEffect(() => {
    if (modalMode === 'edit' && currentTable && showModal) {
      const timeoutId = setTimeout(() => {
        updateTableInfo(true) // silentモードで保存
      }, 500) // 500ms後に保存（連続入力を考慮）
      
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.guestName, formData.castName, formData.editYear, formData.editMonth, formData.editDate, formData.editHour, formData.editMinute])

  // メニューアイテムのクリックハンドラー
  const handleMenuClick = async (action: string) => {
    setShowMenu(false) // メニューを閉じる
    
    switch (action) {
      case 'refresh':
        loadData()
        loadProducts() // 商品データも更新
        alert('データを更新しました')
        break
      case 'cast-sync':
        alert('キャスト同期機能は準備中です')
        break
      case 'report':
        alert('レポート機能は準備中です')
        break
      case 'settings':
        alert('設定機能は準備中です')
        break
      case 'logout':
        if (confirm('ログアウトしますか？')) {
          try {
            // ログアウトAPIを呼び出し
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            // ローカルストレージをクリア
            localStorage.removeItem('isLoggedIn')
            localStorage.removeItem('username')
            
            // ログインページにリダイレクト
            router.push('/login')
          } catch (error) {
            console.error('Logout error:', error)
            alert('ログアウトに失敗しました')
          }
        }
        break
    }
  }

  // テーブル情報更新（silent: 自動保存時はメッセージを出さない）
  const updateTableInfo = async (silent: boolean = false) => {
    try {
      let timeStr: string
      
      if (modalMode === 'new') {
        const now = new Date()
        const minutes = now.getMinutes()
        const roundedMinutes = Math.round(minutes / 5) * 5
        
        now.setMinutes(roundedMinutes)
        now.setSeconds(0)
        now.setMilliseconds(0)
        
        if (roundedMinutes === 60) {
          now.setMinutes(0)
          now.setHours(now.getHours() + 1)
        }
        
        timeStr = getJapanTimeString(now)
      } else {
        const selectedTime = new Date(
          formData.editYear,
          formData.editMonth - 1,
          formData.editDate,
          formData.editHour,
          formData.editMinute
        )
        timeStr = getJapanTimeString(selectedTime)
      }

      await fetch('/api/tables/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable,
          guestName: formData.guestName,
          castName: formData.castName,
          timeStr,
          visitType: formData.visitType
        })
      })
      
      if (!silent) {
        setShowModal(false)
      }
      loadData()
    } catch (error) {
      console.error('Error updating table:', error)
      if (!silent) {
        alert('更新に失敗しました')
      }
    }
  }

  // 会計処理
  const checkout = async () => {
    if (!confirm(`${currentTable} を会計完了にしますか？`)) return
    
    try {
      const checkoutTime = getJapanTimeString(new Date())
      
      await fetch('/api/tables/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableId: currentTable,
          checkoutTime
        })
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
    if (isMoving) return
    
    setIsMoving(true)
    
    try {
      const response = await fetch('/api/tables/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTableId: moveFromTable,
          toTableId: toTable
        })
      })
      
      if (!response.ok) {
        throw new Error('移動に失敗しました')
      }
      
      setTables(prev => {
        const newTables = { ...prev }
        newTables[toTable] = { ...prev[moveFromTable] }
        newTables[moveFromTable] = {
          table: moveFromTable,
          name: '',
          oshi: '',
          time: '',
          visit: '',
          elapsed: '',
          status: 'empty'
        }
        return newTables
      })
      
      endMoveMode()
      
      setTimeout(() => {
        loadData()
      }, 500)
      
    } catch (error) {
      console.error('Error moving table:', error)
      alert('移動に失敗しました')
      endMoveMode()
    } finally {
      setIsMoving(false)
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
    setIsMoving(false)
  }

  // モーダルを開く
  const openModal = (table: TableData) => {
    setCurrentTable(table.table)
    
    if (table.status === 'empty') {
      setModalMode('new')
      const now = new Date()
      setFormData({
        guestName: '',
        castName: '',
        visitType: '',
        editYear: now.getFullYear(),
        editMonth: now.getMonth() + 1,
        editDate: now.getDate(),
        editHour: now.getHours(),
        editMinute: Math.floor(now.getMinutes() / 5) * 5
      })
      setOrderItems([])
    } else {
      setModalMode('edit')
      const time = table.time ? new Date(table.time.replace(' ', 'T')) : new Date()
      setFormData({
        guestName: table.name,
        castName: table.oshi,
        visitType: table.visit,
        editYear: time.getFullYear(),
        editMonth: time.getMonth() + 1,
        editDate: time.getDate(),
        editHour: time.getHours(),
        editMinute: time.getMinutes()
      })
      // TODO: 既存の注文データを読み込む
      setOrderItems([
        { name: '推し', cast: table.oshi, quantity: 1, price: 0 },
        { name: '飲み放題', quantity: 1, price: 3300 }
      ])
    }
    
    setShowModal(true)
    setSelectedCategory('')
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
        } else if (data.status === 'empty' && !isMoving) {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div id="layout" onClick={(e) => {
        if (moveMode && e.target === e.currentTarget) {
          endMoveMode()
        }
      }}>
        <div className="header">
          {/* ハンバーガーメニューボタン */}
          <button 
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="menu-icon">☰</span>
          </button>
          
          📋 テーブル管理システム
          <span style={{ 
            position: 'absolute', 
            right: '20px', 
            fontSize: '24px',
            fontFamily: 'monospace'
          }}>
            {currentTime}
          </span>
        </div>
        
        {/* サイドメニュー */}
        <div className={`side-menu ${showMenu ? 'open' : ''}`}>
          <div className="menu-header">
            <h3>メニュー</h3>
            <button 
              className="menu-close"
              onClick={() => setShowMenu(false)}
            >
              ×
            </button>
          </div>
          <div className="menu-items">
            <button className="menu-item" onClick={() => handleMenuClick('refresh')}>
              <span className="menu-icon">🔄</span>
              データ更新
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('cast-sync')}>
              <span className="menu-icon">👥</span>
              キャスト同期
            </button>
            <div className="menu-divider"></div>
            <button className="menu-item" onClick={() => handleMenuClick('report')}>
              <span className="menu-icon">📊</span>
              レポート
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('settings')}>
              <span className="menu-icon">⚙️</span>
              設定
            </button>
            <div className="menu-divider"></div>
            <button className="menu-item" onClick={() => handleMenuClick('logout')}>
              <span className="menu-icon">🚪</span>
              ログアウト
            </button>
          </div>
        </div>
        
        {/* メニューが開いている時の背景オーバーレイ */}
        {showMenu && (
          <div 
            className="menu-overlay"
            onClick={() => setShowMenu(false)}
          />
        )}
        
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
        <div id="modal" className={modalMode === 'new' ? 'modal-new' : 'modal-edit'}>
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
                  onClick={() => updateTableInfo(false)}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  決定
                </button>
              </div>
            </div>
          ) : (
            <div id="details">
              <div className="order-section">
                <div className="datetime-edit">
                  <span className="label-text">入店日時：</span>
                  <select 
                    value={formData.editYear}
                    onChange={(e) => setFormData({ ...formData, editYear: parseInt(e.target.value) })}
                    className="date-select"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                  <select 
                    value={formData.editMonth}
                    onChange={(e) => setFormData({ ...formData, editMonth: parseInt(e.target.value) })}
                    className="date-select"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                  <select 
                    value={formData.editDate}
                    onChange={(e) => setFormData({ ...formData, editDate: parseInt(e.target.value) })}
                    className="date-select"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}日</option>
                    ))}
                  </select>
                  <select 
                    value={formData.editHour}
                    onChange={(e) => setFormData({ ...formData, editHour: parseInt(e.target.value) })}
                    className="time-select"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select 
                    value={formData.editMinute}
                    onChange={(e) => setFormData({ ...formData, editMinute: parseInt(e.target.value) })}
                    className="time-select"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(min => (
                      <option key={min} value={min}>{min.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                
                <div className="customer-header">
                  <div className="oshi-edit">
                    <span className="label-text">推し：</span>
                    <select 
                      value={formData.castName}
                      onChange={(e) => setFormData({ ...formData, castName: e.target.value })}
                      className="cast-select"
                    >
                      <option value="">-- 推しを選択 --</option>
                      {castList.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="guest-edit">
                    <span className="label-text">お客様名：</span>
                    <input
                      type="text"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="guest-input"
                    />
                  </div>
                </div>

                <div className="pos-container">
                  <div className="left-section">
                    <div className="category-section">
                      <div className="main-categories">
                        <div className="category-title">商品カテゴリー</div>
                        {Object.keys(productCategories).map(category => (
                          <div 
                            key={category}
                            className={`main-category-item ${selectedCategory === category ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedCategory(category)
                            }}
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                      
                      {selectedCategory && (
                        <div className="sub-categories">
                          <div className="category-title">商品一覧</div>
                          {Object.entries(productCategories[selectedCategory]).map(([productName, productData]) => (
                            <div 
                              key={productName}
                              className="sub-category-item"
                              onClick={() => {
                                if (productData.needsCast) {
                                  // キャストが必要な商品の場合は、後で実装
                                  alert('キャスト選択機能は準備中です')
                                } else {
                                  // キャスト不要な商品は直接追加
                                  addProductToOrder(productName, productData.price, false)
                                }
                              }}
                            >
                              {productName}
                              <span className="price">¥{productData.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="right-section">
                    <div className="order-title">お会計</div>
                    <div className="added-item">
                      <span>推し名</span>
                      <span className="price">¥0</span>
                    </div>
                    
                    <div className="order-table">
                      <div className="order-table-header">
                        <span className="col-name">商品名</span>
                        <span className="col-cast">キャスト名</span>
                        <span className="col-qty">個数</span>
                        <span className="col-price">値段</span>
                      </div>
                      <div className="order-table-body">
                        {orderItems.map((item, index) => (
                          <div key={index} className="order-table-row">
                            <span className="col-name">{item.name}</span>
                            <span className="col-cast">{item.cast || ''}</span>
                            <span className="col-qty">{item.quantity}</span>
                            <span className="col-price">¥{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="order-total">
                      <div className="total-row">
                        <span>小計</span>
                        <span>¥{calculateTotal().subtotal.toLocaleString()}</span>
                      </div>
                      <div className="total-row">
                        <span>サービスtax　15%　+</span>
                        <span>¥{calculateTotal().tax.toLocaleString()}</span>
                      </div>
                      <div className="total-row final">
                        <span>合計金額</span>
                        <span className="final-amount">¥{calculateTotal().total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="action-buttons">
                      <button onClick={checkout} className="btn-checkout">会計完了</button>
                      <button onClick={clearTable} className="btn-delete">削除</button>
                    </div>
                  </div>
                </div>
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
          overflow: hidden;
          position: fixed;
          touch-action: none;
        }

        #layout {
          position: relative;
          width: 1024px;
          height: 768px;
          margin: auto;
          background: #f8f8f8;
          border: 1px solid #ccc;
          overflow: hidden;
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

        /* メニューボタン */
        .menu-button {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
          font-size: 28px;
          color: #333;
          transition: transform 0.3s ease;
        }

        .menu-button:hover {
          transform: translateY(-50%) scale(1.1);
        }

        /* サイドメニュー */
        .side-menu {
          position: absolute;
          left: -300px;
          top: 72px;
          width: 280px;
          height: calc(100% - 72px);
          background: white;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          transition: left 0.3s ease;
          z-index: 1000;
          overflow-y: auto;
          max-height: calc(768px - 72px);
          visibility: hidden;
          opacity: 0;
          transition: left 0.3s ease, visibility 0.3s ease, opacity 0.3s ease;
        }

        .side-menu.open {
          left: 0;
          visibility: visible;
          opacity: 1;
        }

        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .menu-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .menu-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .menu-items {
          padding: 10px 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 15px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          text-align: left;
          transition: background-color 0.2s ease;
        }

        .menu-item:hover {
          background-color: #f5f5f5;
        }

        .menu-item .menu-icon {
          margin-right: 15px;
          font-size: 20px;
        }

        .menu-divider {
          height: 1px;
          background-color: #eee;
          margin: 10px 0;
        }

        .menu-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          z-index: 999;
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

        #modal {
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
          max-height: 90vh;
          overflow-y: auto;
        }

        #modal.modal-new {
          width: 400px;
        }

        #modal.modal-edit {
          width: 90%;
          max-width: 900px;
        }

        #move-modal {
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
          width: 400px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .order-section {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .customer-header {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          margin-bottom: 20px;
          font-size: 16px;
          align-items: center;
        }

        .label-text {
          white-space: nowrap;
          margin-right: 5px;
        }

        .datetime-edit {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .date-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .time-edit, .oshi-edit, .guest-edit {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .time-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .cast-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 150px;
        }

        .guest-input {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 150px;
        }

        .pos-container {
          display: flex;
          gap: 20px;
          height: calc(100% - 100px);
        }

        .left-section {
          width: 300px;
          display: flex;
          flex-direction: column;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
        }

        .sub-categories {
          margin-top: 20px;
        }

        .search-section {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 14px;
        }

        .search-button {
          padding: 8px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
        }

        .category-section {
          display: flex;
          gap: 20px;
          flex: 1;
        }

        .main-categories, .sub-categories {
          flex: 1;
        }

        .category-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
          font-weight: bold;
        }

        .main-category-item, .sub-category-item, .cast-item {
          padding: 10px 15px;
          margin-bottom: 5px;
          background: #f5f5f5;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .main-category-item:hover, .sub-category-item:hover, .cast-item:hover {
          background: #e0e0e0;
        }

        .main-category-item.selected, .sub-category-item.selected, .cast-item.selected {
          background: #4CAF50;
          color: white;
        }

        .sub-category-item .price {
          font-size: 13px;
        }

        .cast-select-section {
          margin-top: 20px;
        }

        .right-section {
          width: 400px;
          display: flex;
          flex-direction: column;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
        }

        .order-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .added-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .order-table {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .order-table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.5fr;
          padding: 10px;
          background: #f5f5f5;
          font-weight: bold;
          font-size: 14px;
          text-align: center;
        }

        .order-table-body {
          max-height: 200px;
          overflow-y: auto;
        }

        .order-table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.5fr;
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
          text-align: center;
        }

        .order-total {
          border-top: 1px solid #ddd;
          padding-top: 10px;
          margin-bottom: 20px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 16px;
        }

        .total-row.final {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 20px;
          font-weight: bold;
        }

        .final-amount {
          color: #333;
          font-size: 24px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-checkout, .btn-delete {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }

        .btn-checkout {
          background: #ff9800;
          color: white;
        }

        .btn-delete {
          background: #f44336;
          color: white;
        }

        .add-order-button {
          width: 100%;
          margin-top: 20px;
          padding: 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }

        .add-order-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .add-order-button:hover:not(:disabled) {
          background: #45a049;
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
      `}</style>
    </>
  )
}