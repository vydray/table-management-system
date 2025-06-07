import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ProductSection } from '../components/ProductSection'
import { OrderSection } from '../components/OrderSection'
import { TableData, OrderItem, ProductCategories, ProductCategory, Product } from '../types'

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
  const [selectedProduct, setSelectedProduct] = useState<{name: string, price: number, needsCast: boolean} | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

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
      // キャストが必要な商品を選択
      setSelectedProduct({ name: productName, price: price, needsCast: true })
      return
    }
    
    // 既存の商品をチェック（商品名とキャスト名が同じものを探す）
    const existingItemIndex = orderItems.findIndex(item => 
      item.name === productName && 
      ((!needsCast && !item.cast) || (needsCast && item.cast === castName))
    )
    
    if (existingItemIndex >= 0) {
      // 既存の商品の個数を増やす
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += 1
      setOrderItems(updatedItems)
    } else {
      // 新しい商品を追加
      const newItem: OrderItem = {
        name: productName,
        cast: needsCast ? castName : undefined,
        quantity: 1,
        price: price
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  // 注文アイテムを削除
  const deleteOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index)
    setOrderItems(updatedItems)
  }

  // 注文アイテムの個数を更新
  const updateOrderItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      deleteOrderItem(index)
      return
    }
    const updatedItems = [...orderItems]
    updatedItems[index].quantity = newQuantity
    setOrderItems(updatedItems)
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

  // 注文データを取得
  const loadOrderItems = async (tableId: string) => {
    try {
      const res = await fetch(`/api/orders/current?tableId=${tableId}`)
      const data = await res.json()
      
      if (res.ok && data.length > 0) {
        interface OrderItemDB {
          product_name: string
          cast_name: string | null
          quantity: number
          unit_price: number
        }
        
        const items = data.map((item: OrderItemDB) => ({
          name: item.product_name,
          cast: item.cast_name || undefined,
          quantity: item.quantity,
          price: item.unit_price
        }))
        setOrderItems(items)
      }
    } catch (error) {
      console.error('Error loading order items:', error)
    }
  }

  // 注文内容を保存
  const saveOrderItems = async (silent: boolean = false) => {
    try {
      const response = await fetch('/api/orders/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable,
          orderItems: orderItems
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save order items')
      }
      
      if (!silent) {
        alert('注文内容を保存しました')
      }
    } catch (error) {
      console.error('Error saving order items:', error)
      if (!silent) {
        alert('注文内容の保存に失敗しました')
      }
    }
  }

  // 初期化
  useEffect(() => {
    loadData()
    loadCastList()
    loadProducts()
    
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

  // 注文内容が変更されたら自動保存
  useEffect(() => {
    if (modalMode === 'edit' && currentTable && showModal && orderItems.length >= 0) {
      const timeoutId = setTimeout(() => {
        saveOrderItems(true) // silentモードで保存
      }, 500) // 500ms後に保存
      
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderItems])
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
      // 既存の注文データを読み込む
      loadOrderItems(table.table)
    }
    
    setShowModal(true)
    setSelectedCategory('')
    setSelectedProduct(null)
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
                  <ProductSection
                    productCategories={productCategories}
                    selectedCategory={selectedCategory}
                    selectedProduct={selectedProduct}
                    castList={castList}
                    onSelectCategory={setSelectedCategory}
                    onAddProduct={addProductToOrder}
                  />
                  
                  <OrderSection
                    orderItems={orderItems}
                    onCheckout={checkout}
                    onClearTable={clearTable}
                    onUpdateOrderItem={updateOrderItemQuantity}
                    onDeleteOrderItem={deleteOrderItem}
                  />
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
    </>
  )
}