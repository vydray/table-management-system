import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { SideMenu } from '../components/SideMenu'
import { OrderSection } from '../components/OrderSection'
import { getCurrentStoreId } from '../utils/storeContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 型定義
interface TableData {
  table: string
  name: string
  oshi: string
  time: string
  visit: string
  elapsed: string
  status: 'empty' | 'occupied' | 'reserved' | 'billing'
}

interface ProductCategories {
  [key: string]: { 
    name: string
    price: number
    needsCast: boolean
  }[]
}

interface ProductCategory {
  id: number
  name: string
  is_drink: boolean
  is_bottle: boolean
  requires_cast_selection: boolean
  display_order: number
  is_active: boolean
  show_oshi_first: boolean
}

interface OrderItem {
  name: string
  cast?: string
  quantity: number
  price: number
}

// チェックアウト結果の型定義
interface CheckoutResult {
  receiptNumber?: string
  orderId?: number
  status?: string
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>
}

// テーブルの位置情報（元の固定位置）
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
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new')
  const [moveMode, setMoveMode] = useState(false)
  const [moveFromTable, setMoveFromTable] = useState('')
  const [showMoveHint, setShowMoveHint] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isMoving, setIsMoving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [attendingCastsCount, setAttendingCastsCount] = useState(0)
  const [occupiedTablesCount, setOccupiedTablesCount] = useState(0)
  
  // レスポンシブ用のスケール状態を追加
  const [layoutScale, setLayoutScale] = useState(1)
  const [tableBaseSize, setTableBaseSize] = useState({ width: 130, height: 123 })
  
  // POS機能用の状態
  const [productCategories, setProductCategories] = useState<ProductCategories>({})
  const [productCategoriesData, setProductCategoriesData] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<{name: string, price: number, needsCast: boolean} | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // 会計モーダル用の状態（シンプルな状態管理に変更）
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cash: 0,
    card: 0,
    other: 0,
    otherMethod: '',
    totalAmount: 0
  })
  const [activePaymentInput, setActivePaymentInput] = useState<'cash' | 'card' | 'other'>('cash')

  // フォームデータ
  const [formData, setFormData] = useState({
    guestName: '',
    castName: '',
    visitType: '初回',
    editYear: new Date().getFullYear(),
    editMonth: new Date().getMonth() + 1,
    editDate: new Date().getDate(),
    editHour: new Date().getHours(),
    editMinute: new Date().getMinutes()
  })

  // 経過時間のフォーマット関数
  const formatElapsedTime = (elapsed: string): string => {
    if (!elapsed) return '0分'
    return elapsed.includes(':') ? elapsed : elapsed
  }

  // 支払いデータのリセット
  const resetPaymentData = () => {
    setPaymentData({
      cash: 0,
      card: 0,
      other: 0,
      otherMethod: '',
      totalAmount: 0
    })
    setActivePaymentInput('cash')
  }

  // おつりの計算
  const calculateChange = () => {
    const totalPaid = paymentData.cash + paymentData.card + paymentData.other
    return totalPaid - paymentData.totalAmount
  }
  const getAttendingCastsCount = async () => {
    try {
      const storeId = getCurrentStoreId()
      const today = new Date().toISOString().split('T')[0]
      
      // まず有効な勤怠ステータスを取得
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'active_attendance_statuses')
        .eq('store_id', storeId)
        .single()
      
      let activeStatuses = ['出勤']
      if (settingsData) {
        activeStatuses = JSON.parse(settingsData.setting_value)
      }
      
      // 出勤中のキャスト数を取得
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('cast_name')
        .eq('store_id', storeId)
        .eq('date', today)
        .in('status', activeStatuses)
      
      if (error) throw error
      
      // 重複を除いたキャスト数をカウント
      const uniqueCasts = new Set(attendanceData?.map(a => a.cast_name) || [])
      setAttendingCastsCount(uniqueCasts.size)
    } catch (error) {
      console.error('Error getting attending casts:', error)
      setAttendingCastsCount(0)
    }
  }

  // 使用中のテーブル数を計算
  const updateOccupiedTablesCount = () => {
    const count = Object.values(tables).filter(table => 
      table.status === 'occupied' || table.status === 'billing'
    ).length
    setOccupiedTablesCount(count)
  }

  // 時刻を更新
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // レスポンシブ対応のスケール計算
  useEffect(() => {
    const updateScale = () => {
      const layout = document.getElementById('layout')
      if (!layout) return
      
      const width = layout.getBoundingClientRect().width
      const baseWidth = 1024
      const scale = Math.max(0.5, Math.min(1, width / baseWidth))
      
      setLayoutScale(scale)
      setTableBaseSize({
        width: Math.round(130 * scale),
        height: Math.round(123 * scale)
      })
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // 商品カテゴリを取得
  const loadProductCategories = async () => {
    try {
      const storeId = getCurrentStoreId()
      const response = await fetch(`/api/products/by-category?storeId=${storeId}`)
      const { categories, categoriesData } = await response.json()
      setProductCategories(categories || {})
      setProductCategoriesData(categoriesData || [])
    } catch (error) {
      console.error('Failed to load product categories:', error)
    }
  }

  // テーブル注文を取得
  const loadOrderItems = async (tableId: string) => {
    try {
      const storeId = getCurrentStoreId()
      const response = await fetch(`/api/orders/table/${tableId}?storeId=${storeId}`)
      const data = await response.json()
      
      if (data && data.order_items) {
        const items: OrderItem[] = data.order_items.map((item: {
          product_name: string
          cast_name: string | null
          quantity: number
          price: number
        }) => ({
          name: item.product_name,
          cast: item.cast_name || undefined,
          quantity: item.quantity,
          price: item.price
        }))
        setOrderItems(items)
      }
    } catch (error) {
      console.error('Failed to load order items:', error)
    }
  }

  // 商品を追加
  const addOrderItem = (productName: string, price: number, needsCast: boolean, castName?: string) => {
    if (needsCast && !castName) {
      alert('キャストを選択してください')
      return
    }
    
    const existingItemIndex = orderItems.findIndex(item => 
      item.name === productName && 
      item.cast === castName
    )
    
    if (existingItemIndex !== -1) {
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += 1
      setOrderItems(updatedItems)
    } else {
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

  // 注文アイテムの価格を更新（新規追加）
  const updateOrderItemPrice = (index: number, newPrice: number) => {
    const updatedItems = [...orderItems]
    updatedItems[index].price = newPrice
    setOrderItems(updatedItems)
  }

  // データ取得
  const loadData = async () => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/tables/status?storeId=${storeId}`)
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
      
      // 取得したデータで更新（tablePositionsに存在するテーブルのみ）
      data.forEach(item => {
        // tablePositionsに定義されているテーブルのみ処理
        if (!tablePositions[item.table as keyof typeof tablePositions]) {
          return
        }
        
        // 経過時間を計算
        let elapsed = ''
        if (item.time) {
          const startTime = new Date(item.time.replace(' ', 'T'))
          const now = new Date()
          const diffMs = now.getTime() - startTime.getTime()
          const hours = Math.floor(diffMs / (1000 * 60 * 60))
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          elapsed = `${hours}:${minutes.toString().padStart(2, '0')}`
        }
        
        tableMap[item.table] = {
          ...item,
          elapsed: elapsed || ''
        }
      })
      
      setTables(tableMap)
      updateOccupiedTablesCount()
    } catch (error) {
      console.error('Failed to load table data:', error)
    }
  }

  // キャストリストを取得
  const loadCastList = async () => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/casts?storeId=${storeId}`)
      const data = await res.json()
      setCastList(data || [])
    } catch (error) {
      console.error('Failed to load cast list:', error)
    }
  }

  // 初期データ読み込み
  useEffect(() => {
    loadData()
    loadCastList()
    loadProductCategories()
    getAttendingCastsCount()
    
    const interval = setInterval(() => {
      loadData()
      getAttendingCastsCount()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // テーブル数が変わった時に再計算
  useEffect(() => {
    updateOccupiedTablesCount()
  }, [tables])

  // チェックアウト処理
  const handleCheckout = async (): Promise<CheckoutResult> => {
    if (!currentTable) return { status: 'error', message: 'テーブルが選択されていません' }
    
    try {
      const storeId = getCurrentStoreId()
      const currentTableData = tables[currentTable]
      
      // 注文データを作成（会計処理）
      const orderData = {
        storeId,
        tableId: currentTable,
        guestName: currentTableData.name,
        castName: currentTableData.oshi,
        visitType: currentTableData.visit || '初回',
        checkInTime: currentTableData.time,
        items: orderItems,
        paymentCash: paymentData.cash,
        paymentCard: paymentData.card,
        change: calculateChange()
      }
      
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // テーブルをクリア
        await fetch('/api/tables/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storeId, tableId: currentTable }),
        })
        
        // 状態をリセット
        setShowModal(false)
        setOrderItems([])
        loadData()
        
        return {
          status: 'success',
          receiptNumber: result.receiptNumber,
          orderId: result.orderId,
          data: result
        }
      } else {
        throw new Error(result.error || '会計処理に失敗しました')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '会計処理中にエラーが発生しました'
      }
    }
  }

  // 新規登録/編集の保存
  const handleSave = async () => {
    const storeId = getCurrentStoreId()
    const endpoint = modalMode === 'new' ? '/api/tables/checkin' : '/api/tables/update'
    
    const checkInTime = new Date(
      formData.editYear,
      formData.editMonth - 1,
      formData.editDate,
      formData.editHour,
      formData.editMinute
    )
    
    const data = {
      storeId,
      tableId: currentTable,
      guestName: formData.guestName,
      castName: formData.castName,
      visitType: formData.visitType,
      checkInTime: checkInTime.toISOString(),
      ...(modalMode === 'edit' && { items: orderItems })
    }
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (res.ok) {
        setShowModal(false)
        loadData()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  // テーブルクリア
  const handleClearTable = async () => {
    if (!confirm('テーブルをクリアしますか？')) return
    
    const storeId = getCurrentStoreId()
    try {
      const res = await fetch('/api/tables/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, tableId: currentTable })
      })
      
      if (res.ok) {
        setShowModal(false)
        loadData()
      }
    } catch (error) {
      console.error('Failed to clear table:', error)
    }
  }

  // 移動モード開始
  const startMoveMode = (tableId: string) => {
    setMoveMode(true)
    setMoveFromTable(tableId)
    setShowMoveHint(true)
    setTimeout(() => setShowMoveHint(false), 2000)
  }

  // 移動モード終了
  const endMoveMode = () => {
    setMoveMode(false)
    setMoveFromTable('')
  }

  // テーブル移動
  const moveTable = async (toTable: string) => {
    if (isMoving) return
    setIsMoving(true)
    
    const storeId = getCurrentStoreId()
    try {
      const res = await fetch('/api/tables/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, fromTable: moveFromTable, toTable })
      })
      
      if (res.ok) {
        await loadData()
      } else {
        alert('移動に失敗しました')
      }
    } catch (error) {
      console.error('Failed to move table:', error)
      alert('移動に失敗しました')
    } finally {
      setIsMoving(false)
      endMoveMode()
    }
  }

  // テーブルクリック処理
  const handleTableClick = (tableId: string) => {
    if (moveMode) {
      if (tableId !== moveFromTable && tables[tableId].status === 'empty') {
        moveTable(tableId)
      }
    } else {
      openModal(tableId, tables[tableId].status === 'empty' ? 'new' : 'edit')
    }
  }

  // モーダルを開く
  const openModal = (tableId: string, mode: 'new' | 'edit') => {
    setCurrentTable(tableId)
    setModalMode(mode)
    
    const table = tables[tableId]
    if (mode === 'edit' && table) {
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
      setOrderItems([])
      loadOrderItems(table.table)
    }
    
    // bodyにクラスを追加
    document.body.classList.add('modal-open')
    
    setShowModal(true)
    setSelectedCategory('')
    setSelectedProduct(null)
  }

  // 現在のカテゴリーの推し優先表示設定を取得
  const getCurrentCategoryShowOshiFirst = () => {
    const categoryData = productCategoriesData.find(cat => cat.name === selectedCategory)
    return categoryData?.show_oshi_first || false
  }
  
  // テーブル位置を計算する関数
  const calculateTablePosition = (tableId: string) => {
    const originalPosition = tablePositions[tableId as keyof typeof tablePositions]
    if (!originalPosition) return { top: 0, left: 0 }
    
    const layout = document.getElementById('layout')
    const layoutWidth = layout?.getBoundingClientRect().width || 1024
    const scaledContentWidth = 1024 * layoutScale
    const horizontalOffset = (layoutWidth - scaledContentWidth) / 2
    
    const headerHeight = 72
    return {
      top: Math.round((originalPosition.top - headerHeight) * layoutScale + headerHeight),
      left: Math.round(originalPosition.left * layoutScale + horizontalOffset)
    }
  }
  
  return (
    <>
      <Head>
        <title>📋 テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div id="layout" className="responsive-layout" onClick={(e) => {
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
          
          {/* キャスト人数 - 卓数表示 */}
          <span style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '20px',
            fontWeight: 'bold',
            color: attendingCastsCount - occupiedTablesCount >= 0 ? '#4CAF50' : '#F44336'
          }}>
            👥 {attendingCastsCount} - 🪑 {occupiedTablesCount} = {attendingCastsCount - occupiedTablesCount >= 0 ? '+' : ''}{attendingCastsCount - occupiedTablesCount}
          </span>
          
          <span style={{ 
            position: 'absolute', 
            right: '20px', 
            fontSize: '24px',
            fontFamily: 'monospace'
          }}>
            {currentTime}
          </span>
        </div>
        
        {/* サイドメニューコンポーネント */}
        <SideMenu 
          isOpen={showMenu} 
          onClose={() => setShowMenu(false)} 
          onMenuClick={(action) => {
            setShowMenu(false)
            switch(action) {
              case 'refresh':
                loadData()
                break
              case 'attendance':
                router.push('/attendance')
                break
              case 'receipts':
                router.push('/receipts')
                break
              case 'report':
                router.push('/report')
                break
              case 'settings':
                router.push('/settings')
                break
              case 'logout':
                if (confirm('ログアウトしますか？')) {
                  localStorage.removeItem('isLoggedIn')
                  router.push('/login')
                }
                break
            }
          }}
        />
        
        {/* フロアマップ */}
        <div 
          id="floor-container"
          style={{
            position: 'relative',
            height: 'calc(100vh - 72px)',
            overflow: 'hidden',
            backgroundColor: '#f8f8f8',
            backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            transformOrigin: 'top center',
            transform: `scale(${layoutScale})`,
            width: '1024px',
            margin: '0 auto'
          }}
        >
          {/* テーブル配置 */}
          {Object.entries(tables).map(([tableId, table]) => {
            const position = calculateTablePosition(tableId)
            const isTargetTable = moveMode && tableId !== moveFromTable && table.status === 'empty'
            
            return (
              <div
                key={tableId}
                onClick={() => handleTableClick(tableId)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (table.status !== 'empty') {
                    startMoveMode(tableId)
                  }
                }}
                style={{
                  position: 'absolute',
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  width: `${tableBaseSize.width}px`,
                  height: `${tableBaseSize.height}px`,
                  backgroundColor: table.status === 'empty' ? '#fff' : 
                                 table.status === 'billing' ? '#ffeb3b' : '#4CAF50',
                  border: isTargetTable ? '3px dashed #2196F3' : 
                         tableId === moveFromTable ? '3px solid #f44336' : '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: moveMode ? (isTargetTable ? 'pointer' : 'not-allowed') : 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: table.status !== 'empty' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.3s ease',
                  opacity: moveMode && !isTargetTable && tableId !== moveFromTable ? 0.5 : 1
                }}
              >
                <div style={{ 
                  fontSize: `${16 * layoutScale}px`, 
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  {tableId}
                </div>
                {table.status !== 'empty' && (
                  <>
                    <div style={{ 
                      fontSize: `${14 * layoutScale}px`, 
                      marginBottom: '3px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}>
                      {table.name}
                    </div>
                    <div style={{ 
                      fontSize: `${12 * layoutScale}px`, 
                      color: '#666',
                      marginBottom: '3px'
                    }}>
                      {table.oshi}
                    </div>
                    <div style={{ 
                      fontSize: `${12 * layoutScale}px`, 
                      color: '#666' 
                    }}>
                      {formatElapsedTime(table.elapsed)}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* 移動モードのヒント */}
        {showMoveHint && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '10px',
            fontSize: '18px',
            zIndex: 10000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            空いているテーブルをクリックして移動
          </div>
        )}

        {/* モーダル */}
        {showModal && (
          <div
            id="modal"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              zIndex: 1000,
              overflowY: 'auto',
              paddingTop: '20px',
              paddingBottom: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                document.body.classList.remove('modal-open')
                setShowModal(false)
              }
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                width: '90%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                margin: '0 auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* モーダルヘッダー */}
              <div style={{
                backgroundColor: '#FF9800',
                color: 'white',
                padding: '15px 20px',
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>
                  {modalMode === 'new' ? `テーブル ${currentTable} - 新規登録` : `テーブル ${currentTable} - 編集`}
                </h2>
                <button
                  onClick={() => {
                    document.body.classList.remove('modal-open')
                    setShowModal(false)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>

              {/* モーダルコンテンツ */}
              <div style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1
              }}>
                {/* 顧客情報セクション */}
                <div className="customer-header">
                  <div>
                    <span className="label-text">ゲスト名:</span>
                    <input
                      type="text"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <span className="label-text">推し:</span>
                    <select
                      className="cast-select"
                      value={formData.castName}
                      onChange={(e) => setFormData({ ...formData, castName: e.target.value })}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '120px'
                      }}
                    >
                      <option value="">選択してください</option>
                      {castList.map(cast => (
                        <option key={cast} value={cast}>{cast}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <span className="label-text">来店種別:</span>
                    <select
                      className="visit-select"
                      value={formData.visitType}
                      onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                    >
                      <option value="初回">初回</option>
                      <option value="再来">再来</option>
                      <option value="場内">場内</option>
                      <option value="同伴">同伴</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className="label-text">入店時刻:</span>
                    <input
                      type="number"
                      value={formData.editYear}
                      onChange={(e) => setFormData({ ...formData, editYear: parseInt(e.target.value) || new Date().getFullYear() })}
                      style={{ width: '60px', marginRight: '5px' }}
                      min="2000"
                      max="2099"
                    />
                    年
                    <input
                      type="number"
                      value={formData.editMonth}
                      onChange={(e) => setFormData({ ...formData, editMonth: parseInt(e.target.value) || 1 })}
                      style={{ width: '40px', margin: '0 5px' }}
                      min="1"
                      max="12"
                    />
                    月
                    <input
                      type="number"
                      value={formData.editDate}
                      onChange={(e) => setFormData({ ...formData, editDate: parseInt(e.target.value) || 1 })}
                      style={{ width: '40px', margin: '0 5px' }}
                      min="1"
                      max="31"
                    />
                    日
                    <input
                      type="number"
                      value={formData.editHour}
                      onChange={(e) => setFormData({ ...formData, editHour: parseInt(e.target.value) || 0 })}
                      style={{ width: '40px', margin: '0 5px' }}
                      min="0"
                      max="23"
                    />
                    :
                    <input
                      type="number"
                      value={formData.editMinute}
                      onChange={(e) => setFormData({ ...formData, editMinute: parseInt(e.target.value) || 0 })}
                      style={{ width: '40px', marginLeft: '5px' }}
                      min="0"
                      max="59"
                    />
                  </div>
                </div>

                {/* 既存のPOS機能部分 */}
                {modalMode === 'edit' && (
                  <>
                    {/* カテゴリ選択 */}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '20px',
                      flexWrap: 'wrap'
                    }}>
                      {Object.keys(productCategories).map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: selectedCategory === category ? '#FF9800' : '#f0f0f0',
                            color: selectedCategory === category ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s'
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    {/* 商品選択エリア */}
                    {selectedCategory && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '10px',
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                        {(() => {
                          const showOshiFirst = getCurrentCategoryShowOshiFirst()
                          const categoryProducts = productCategories[selectedCategory] || []
                          
                          if (showOshiFirst && formData.castName) {
                            const oshiProducts = categoryProducts.filter(p => 
                              p.name.includes(formData.castName)
                            )
                            const otherProducts = categoryProducts.filter(p => 
                              !p.name.includes(formData.castName)
                            )
                            return [...oshiProducts, ...otherProducts]
                          }
                          
                          return categoryProducts
                        })().map((product, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (product.needsCast) {
                                setSelectedProduct(product)
                              } else {
                                addOrderItem(product.name, product.price, false)
                              }
                            }}
                            style={{
                              padding: '15px 10px',
                              backgroundColor: product.name.includes(formData.castName) ? '#FFE0B2' : 'white',
                              border: '1px solid #ddd',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'all 0.3s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                            <div style={{ color: '#666' }}>¥{product.price.toLocaleString()}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* キャスト選択モーダル */}
                    {selectedProduct && (
                      <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 2000
                      }}>
                        <div style={{
                          backgroundColor: 'white',
                          padding: '20px',
                          borderRadius: '10px',
                          maxWidth: '400px',
                          width: '90%'
                        }}>
                          <h3>キャストを選択してください</h3>
                          <p>商品: {selectedProduct.name}</p>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addOrderItem(
                                  selectedProduct.name,
                                  selectedProduct.price,
                                  true,
                                  e.target.value
                                )
                                setSelectedProduct(null)
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              marginBottom: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '5px'
                            }}
                          >
                            <option value="">選択してください</option>
                            {castList.map(cast => (
                              <option key={cast} value={cast}>{cast}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setSelectedProduct(null)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#f0f0f0',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 注文内容表示 - OrderSectionコンポーネントを使用 */}
                    <OrderSection
                      orderItems={orderItems}
                      onCheckout={() => {
                        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        const serviceTax = Math.floor(subtotal * 0.15) // 15%のサービス料
                        const total = subtotal + serviceTax
                        resetPaymentData()
                        setPaymentData(prev => ({ ...prev, totalAmount: total }))
                        setActivePaymentInput('cash')
                        setShowPaymentModal(true)
                      }}
                      onClearTable={handleClearTable}
                      onUpdateOrderItem={updateOrderItemQuantity}
                      onDeleteOrderItem={deleteOrderItem}
                      onUpdateOrderItemPrice={updateOrderItemPrice}
                      formData={formData}
                      onUpdateFormData={(updates) => setFormData({ ...formData, ...updates })}
                      castList={castList}
                      subtotal={orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                      serviceTax={Math.floor(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.15)}
                      roundedTotal={orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Math.floor(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.15)}
                      roundingAdjustment={0}
                    />
                  </>
                )}

                {/* アクションボタン */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px',
                  justifyContent: 'flex-end'
                }}>
                  {modalMode === 'new' ? (
                    <button
                      onClick={handleSave}
                      style={{
                        padding: '10px 30px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      登録
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleClearTable}
                        style={{
                          padding: '10px 30px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        クリア
                      </button>
                      <button
                        onClick={handleSave}
                        style={{
                          padding: '10px 30px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        更新
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 会計モーダル（シンプルな実装） */}
        {showPaymentModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000
            }}
            onClick={() => setShowPaymentModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '30px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>会計処理</h2>
              
              <div style={{ marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
                合計金額: ¥{paymentData.totalAmount.toLocaleString()}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>現金:</label>
                <input
                  type="number"
                  value={paymentData.cash}
                  onChange={(e) => setPaymentData({ ...paymentData, cash: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>カード:</label>
                <input
                  type="number"
                  value={paymentData.card}
                  onChange={(e) => setPaymentData({ ...paymentData, card: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>その他:</label>
                <input
                  type="number"
                  value={paymentData.other}
                  onChange={(e) => setPaymentData({ ...paymentData, other: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div>支払合計: ¥{(paymentData.cash + paymentData.card + paymentData.other).toLocaleString()}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: calculateChange() >= 0 ? '#4CAF50' : '#f44336' }}>
                  {calculateChange() >= 0 ? 'おつり' : '不足'}: ¥{Math.abs(calculateChange()).toLocaleString()}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={async () => {
                    if (paymentData.cash + paymentData.card + paymentData.other < paymentData.totalAmount) {
                      alert('支払金額が不足しています')
                      return
                    }
                    const result = await handleCheckout()
                    setShowPaymentModal(false)
                    resetPaymentData()
                    
                    if (result.status === 'success') {
                      alert(`会計が完了しました。\nレシート番号: ${result.receiptNumber}`)
                    } else {
                      alert(result.message || '会計処理に失敗しました')
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  完了
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: '#f0f0f0',
                    color: 'black',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
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