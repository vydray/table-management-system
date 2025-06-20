import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ProductSection } from '../components/ProductSection'
import { OrderSection } from '../components/OrderSection'
import { TableData, OrderItem, ProductCategories, ProductCategory, Product } from '../types'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const [productCategoriesData, setProductCategoriesData] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<{name: string, price: number, needsCast: boolean} | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // 会計モーダル用の状態
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cash: 0,
    card: 0,
    other: 0,
    otherMethod: ''
  })
  const [activePaymentInput, setActivePaymentInput] = useState<'cash' | 'card' | 'other'>('cash')

  // システム設定の状態
  const [systemSettings, setSystemSettings] = useState({
    consumptionTaxRate: 0.10,
    serviceChargeRate: 0.15,
    roundingUnit: 100,
    roundingMethod: 0
  })

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

  // 合計金額を計算する関数
  const getTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const serviceTax = Math.floor(subtotal * systemSettings.serviceChargeRate)
    return subtotal + serviceTax
  }

  // 端数処理を計算する関数
  const getRoundedTotal = (amount: number) => {
    if (systemSettings.roundingUnit <= 0) return amount
    
    switch (systemSettings.roundingMethod) {
      case 0: // 切り捨て
        return Math.floor(amount / systemSettings.roundingUnit) * systemSettings.roundingUnit
      case 1: // 切り上げ
        return Math.ceil(amount / systemSettings.roundingUnit) * systemSettings.roundingUnit
      case 2: // 四捨五入
        return Math.round(amount / systemSettings.roundingUnit) * systemSettings.roundingUnit
      default:
        return amount
    }
  }

  // 端数調整額を取得
  const getRoundingAdjustment = () => {
    const originalTotal = getTotal()
    const roundedTotal = getRoundedTotal(originalTotal)
    return roundedTotal - originalTotal
  }

  // 数字パッド用の関数
  const handleNumberClick = (num: string) => {
    setPaymentData(prev => {
      const currentValue = prev[activePaymentInput]
      const newValue = currentValue === 0 ? parseInt(num) : parseInt(currentValue.toString() + num)
      return {
        ...prev,
        [activePaymentInput]: newValue
      }
    })
  }

  const handleQuickAmount = (amount: number) => {
    setPaymentData(prev => ({
      ...prev,
      [activePaymentInput]: amount
    }))
  }

  const handleDeleteNumber = () => {
    setPaymentData(prev => {
      const currentValue = prev[activePaymentInput].toString()
      if (currentValue.length > 1) {
        return {
          ...prev,
          [activePaymentInput]: parseInt(currentValue.slice(0, -1))
        }
      } else {
        return {
          ...prev,
          [activePaymentInput]: 0
        }
      }
    })
  }

  const handleClearNumber = () => {
    setPaymentData(prev => ({
      ...prev,
      [activePaymentInput]: 0
    }))
  }

  // システム設定を取得
  const loadSystemSettings = async () => {
    const storeId = getCurrentStoreId()
    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('store_id', storeId)
    
    if (settings) {
      const settingsObj = {
        consumptionTaxRate: settings.find(s => s.setting_key === 'consumption_tax_rate')?.setting_value || 0.10,
        serviceChargeRate: settings.find(s => s.setting_key === 'service_charge_rate')?.setting_value || 0.15,
        roundingUnit: settings.find(s => s.setting_key === 'rounding_unit')?.setting_value || 100,
        roundingMethod: settings.find(s => s.setting_key === 'rounding_method')?.setting_value || 0
      }
      setSystemSettings(settingsObj)
    }
  }

  // 商品データをAPIから取得
  const loadProducts = async () => {
    try {
      console.log('商品データ読み込み開始...')
      
      // 店舗IDを取得
      const storeId = getCurrentStoreId()
      
      // APIに店舗IDを渡す
      const res = await fetch(`/api/products?storeId=${storeId}`)
      const data = await res.json()
      
      console.log('APIレスポンス:', data)
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }
      
      const { categories, products } = data
      
      // カテゴリーデータを保存
      setProductCategoriesData(categories || [])
      
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
    
    // 既存の商品をチェック（商品名、キャスト名、価格が全て同じものを探す）
    const existingItemIndex = orderItems.findIndex(item => 
      item.name === productName && 
      item.price === price &&  // 価格も一致条件に追加
      ((!needsCast && !item.cast) || (needsCast && item.cast === castName))
    )
    
    if (existingItemIndex >= 0) {
      // 既存の商品の個数を増やす
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += 1
      setOrderItems(updatedItems)
    } else {
      // 新しい商品を追加（価格が異なる場合は別商品として扱う）
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
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/casts/list?storeId=${storeId}`)
      const data = await res.json()
      setCastList(data)
    } catch (error) {
      console.error('Error loading cast list:', error)
    }
  }

  // 注文データを取得
  const loadOrderItems = async (tableId: string) => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/orders/current?tableId=${tableId}&storeId=${storeId}`)
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
      } else {
        setOrderItems([])  // データがない場合は空配列をセット
      }
    } catch (error) {
      console.error('Error loading order items:', error)
      setOrderItems([])  // エラーの場合も空配列をセット
    }
  }

  // 注文内容を保存
  const saveOrderItems = async (silent: boolean = false) => {
    try {
      const storeId = getCurrentStoreId()
      const response = await fetch('/api/orders/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable,
          orderItems: orderItems,
          storeId: storeId  // 店舗IDを追加
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
    loadSystemSettings()
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
          try {
            // ログアウトAPIを呼び出し
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            // ローカルストレージをクリア
            localStorage.removeItem('isLoggedIn')
            localStorage.removeItem('username')
            localStorage.removeItem('currentStoreId')
            
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

      const storeId = getCurrentStoreId()
      await fetch('/api/tables/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable,
          guestName: formData.guestName,
          castName: formData.castName,
          timeStr,
          visitType: formData.visitType,
          storeId: storeId  // 店舗IDを追加
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

  // 会計処理（修正版）
  const checkout = async () => {
    // 会計モーダルを表示
    setPaymentData({
      cash: 0,
      card: 0,
      other: 0,
      otherMethod: ''
    })
    setActivePaymentInput('cash')
    setShowPaymentModal(true)
  }

  // 会計完了処理（修正版）
  const completeCheckout = async () => {
    const totalPaid = paymentData.cash + paymentData.card + paymentData.other
    const roundedTotal = getRoundedTotal(getTotal())
    
    if (totalPaid < roundedTotal) {
      alert('支払金額が不足しています')
      return
    }
    
    if (!confirm(`${currentTable} を会計完了にしますか？`)) return
    
    try {
      const checkoutTime = getJapanTimeString(new Date())
      const storeId = getCurrentStoreId()
      
      console.log('送信データ:', { 
        tableId: currentTable,
        checkoutTime,
        orderItems: orderItems,
        guestName: formData.guestName,
        castName: formData.castName,
        visitType: formData.visitType,
        paymentCash: paymentData.cash,
        paymentCard: paymentData.card,
        paymentOther: paymentData.other,
        paymentOtherMethod: paymentData.otherMethod,
        totalAmount: roundedTotal,
        storeId: storeId
      })
      
      const response = await fetch('/api/tables/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableId: currentTable,
          checkoutTime,
          orderItems: orderItems,
          guestName: formData.guestName,
          castName: formData.castName,
          visitType: formData.visitType,
          paymentCash: paymentData.cash,
          paymentCard: paymentData.card,
          paymentOther: paymentData.other,
          paymentOtherMethod: paymentData.otherMethod,
          totalAmount: getRoundedTotal(getTotal()),
          storeId: storeId  // 店舗IDを追加
        })
      })
      
      const result = await response.json()
      console.log('API応答:', result)
      
      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed')
      }
      
      // モーダルを閉じる
      document.body.classList.remove('modal-open')
      setShowPaymentModal(false)
      setOrderItems([])
      setShowModal(false)
      
      // データを再読み込み（これで卓が空席になるはず）
      await loadData()
    } catch (error) {
      console.error('Error checkout:', error)
      alert('会計処理に失敗しました')
    }
  }

  // テーブルクリア（修正版）
  const clearTable = async () => {
    if (!confirm(`${currentTable} の情報を削除しますか？`)) return
    
    try {
      const storeId = getCurrentStoreId()
      await fetch('/api/tables/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableId: currentTable,
          storeId: storeId
        })
      })
      
      // 注文データをクリア
      document.body.classList.remove('modal-open')  // iPad対応
      setOrderItems([])
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
      const storeId = getCurrentStoreId()
      const response = await fetch('/api/tables/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTableId: moveFromTable,
          toTableId: toTable,
          storeId: storeId
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

  // モーダルを開く（修正版）
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
      setOrderItems([])  // 空席の場合は必ずクリア
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
      setOrderItems([])  // 一旦クリアしてから
      loadOrderItems(table.table)  // 改めて読み込む
    }
    
    // bodyにクラスを追加（iPad対応）
    document.body.classList.add('modal-open')
    
    setShowModal(true)
    setSelectedCategory('')
    setSelectedProduct(null)
  }

// テーブルコンポーネント（修正版）
const Table = ({ tableId, data }: { tableId: string, data: TableData }) => {
  const [startPos, setStartPos] = useState({ x: 0, y: 0, time: 0 })
  
  // 元の固定位置を取得して初期値として使用
  const originalPosition = tablePositions[tableId as keyof typeof tablePositions]
  const [tablePosition, setTablePosition] = useState(() => {
    if (!originalPosition) return { top: 0, left: 0 }
    return { top: originalPosition.top, left: originalPosition.left }
  })
  const [tableSize, setTableSize] = useState({ width: 130, height: 123 })
  
  // レスポンシブ対応：画面サイズに応じた位置計算（改善版）
  useEffect(() => {
    let mounted = true
    let calculationCount = 0
    const maxCalculations = 3  // 最大3回まで
    
    const calculatePositionAndSize = () => {
      if (!mounted || calculationCount >= maxCalculations) return
      calculationCount++
      
      const layout = document.getElementById('layout')
      if (!layout) return
      
      const originalPosition = tablePositions[tableId as keyof typeof tablePositions]
      if (!originalPosition) return
      
      const layoutRect = layout.getBoundingClientRect()
      const baseWidth = 1024
      const baseHeight = 768
      const headerHeight = 72  // ヘッダーの高さ
      
      // 実際の使用可能な高さ（ヘッダーを除く）
      const availableHeight = layoutRect.height - headerHeight
      
      // 画面サイズに応じたスケール計算
      const scaleX = layoutRect.width / baseWidth
      const scaleY = availableHeight / (baseHeight - headerHeight)
      
      // アスペクト比を維持するため、小さい方のスケールを使用
      const scale = Math.min(scaleX, scaleY, 1)  // 最大1倍まで
      
      // 位置の計算（ヘッダーの高さを考慮）
      setTablePosition({
        top: Math.round((originalPosition.top - headerHeight) * scale + headerHeight),
        left: Math.round(originalPosition.left * scale)
      })
      
      // サイズの計算
      setTableSize({
        width: Math.round(130 * scale),
        height: Math.round(123 * scale)
      })
    }
    
    // 初回実行
    const timer = setTimeout(calculatePositionAndSize, 100)
    
    // リサイズ時の再計算（debounce付き）
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      calculationCount = 0  // リサイズ時はカウントリセット
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(calculatePositionAndSize, 200)
    }
    
    // イベントリスナーの設定（リサイズのみ）
    window.addEventListener('resize', handleResize)
    
    return () => {
      mounted = false
      clearTimeout(timer)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [tableId])
  
  const handleStart = (x: number, y: number) => {
    // モーダルが開いている場合は長押し機能を無効化
    if (showModal) {
      return;
    }
    
    // 振動フィードバック（Android対応）
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // 10ms振動
    }
    
    setStartPos({ x, y, time: Date.now() })
    
    if (data.status === 'occupied' && !moveMode) {
      longPressTimer.current = setTimeout(() => {
        if (!isLongPress.current) {
          isLongPress.current = true
          // 長押し成功時も振動
          if ('vibrate' in navigator) {
            navigator.vibrate(50); // 50ms振動
          }
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
      if (!moveMode && !showModal) {  // モーダルが開いていない時のみ
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
  
  // positionが存在しない場合の対処
  if (!originalPosition) {
    console.error(`Position not found for table: ${tableId}`)
    return null
  }
  
  return (
    <div
      className={`table ${data.status} ${
        moveMode && moveFromTable === tableId ? 'lifting' : ''
      } ${
        moveMode && data.status === 'empty' ? 'move-target' : ''
      } ${
        moveMode && data.status === 'occupied' && tableId !== moveFromTable ? 'move-mode' : ''
      }`}
      style={{ 
        position: 'absolute',
        top: `${tablePosition.top}px`, 
        left: `${tablePosition.left}px`,
        width: `${tableSize.width}px`,
        height: `${tableSize.height}px`
      }}
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

  // 現在のカテゴリーの推し優先表示設定を取得
  const getCurrentCategoryShowOshiFirst = () => {
    const categoryData = productCategoriesData.find(cat => cat.name === selectedCategory)
    return categoryData?.show_oshi_first || false
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
            <button className="menu-item" onClick={() => handleMenuClick('attendance')}>
              <span className="menu-icon">👥</span>
              勤怠登録
            </button>
            <div className="menu-divider"></div>
            <button className="menu-item" onClick={() => handleMenuClick('receipts')}>
              <span className="menu-icon">📋</span>
              伝票管理
            </button>
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
          document.body.classList.remove('modal-open')  // iPad対応
          setShowModal(false)
          setShowMoveModal(false)
        }} />
      )}

      {/* メインモーダル */}
      {showModal && (
        <div id="modal" className={modalMode === 'new' ? 'modal-new' : 'modal-edit'}>
          <button id="modal-close" onClick={() => {
            document.body.classList.remove('modal-open')  // iPad対応
            setShowModal(false)
          }}>×</button>
          <h3>
            📌 {currentTable} の操作
            {modalMode === 'edit' && (
              <span style={{
                marginLeft: '20px',
                fontSize: '18px',     // 16pxから18pxに変更
                fontWeight: 'bold',   // normalからboldに変更
                color: '#000'         // #666から#000（黒）に変更
              }}>
                滞在時間: {tables[currentTable]?.elapsed || '0分'}
              </span>
            )}
          </h3>

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

                <div className="pos-container">
                  <ProductSection
                    productCategories={productCategories}
                    selectedCategory={selectedCategory}
                    selectedProduct={selectedProduct}
                    castList={castList}
                    currentOshi={formData.castName}
                    showOshiFirst={getCurrentCategoryShowOshiFirst()}
                    onSelectCategory={setSelectedCategory}
                    onAddProduct={addProductToOrder}
                  />
                  
                  <OrderSection
                    orderItems={orderItems}
                    onCheckout={checkout}
                    onClearTable={clearTable}
                    onUpdateOrderItem={updateOrderItemQuantity}
                    onDeleteOrderItem={deleteOrderItem}
                    onUpdateOrderItemPrice={updateOrderItemPrice}
                    castName={formData.castName}
                    guestName={formData.guestName}
                    onUpdateCast={(value) => setFormData({ ...formData, castName: value })}
                    onUpdateGuest={(value) => setFormData({ ...formData, guestName: value })}
                    castList={castList}
                    subtotal={orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                    serviceTax={Math.floor(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * systemSettings.serviceChargeRate)}
                    roundedTotal={getRoundedTotal(getTotal())}
                    roundingAdjustment={getRoundingAdjustment()}
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
                  const storeId = getCurrentStoreId()
                  fetch('/api/tables/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fromTableId: currentTable,
                      toTableId: toTable,
                      storeId: storeId
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

      {/* 会計モーダル（数字パッド付き） */}
      {showPaymentModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10000
            }}
            onClick={() => setShowPaymentModal(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 10001,
              width: '900px',
              maxWidth: '95%',
              maxHeight: '90vh',
              display: 'flex',
              overflow: 'hidden'
            }}
          >
            {/* 左側：支払い方法入力部分 */}
            <div style={{
              flex: 1,
              padding: '30px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0 }}>会計処理 - {currentTable}</h3>
                <div style={{
                  textAlign: 'right',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                 
                 
                </div>
              </div>
              
              <div style={{ 
                marginBottom: '25px', 
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px'
              }}>
               <div style={{ 
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px',
  paddingBottom: '15px',
  borderBottom: '2px solid #ccc'
}}>
  <div>
    <strong>小計：¥{getTotal().toLocaleString()}</strong>
  </div>
  <div style={{
    display: 'flex',
    gap: '30px',
    fontSize: '16px'
  }}>
    <div><strong>推し：</strong>{formData.castName || ''}</div>
    <div><strong>お客様：</strong>{formData.guestName || ''}</div>
  </div>
</div>
                {getRoundingAdjustment() !== 0 && (
                  <div style={{ 
                    marginBottom: '10px', 
                    color: getRoundingAdjustment() < 0 ? '#d32f2f' : '#388e3c' 
                  }}>
                    端数調整: {getRoundingAdjustment() < 0 ? '' : '+'}¥{getRoundingAdjustment().toLocaleString()}
                  </div>
                )}
                
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  borderTop: '1px solid #ccc',
                  paddingTop: '10px',
                  textAlign: 'center'
                }}>
                  合計金額: ¥{getRoundedTotal(getTotal()).toLocaleString()}
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '15px' }}>支払い方法:</h4>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ width: '80px' }}>現金</label>
                    <span>¥</span>
                    <input
                      type="text"
                      value={paymentData.cash ? paymentData.cash.toLocaleString() : '0'}
                      onClick={() => setActivePaymentInput('cash')}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: activePaymentInput === 'cash' ? '2px solid #ff9800' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: activePaymentInput === 'cash' ? '#fff8e1' : 'white'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ width: '80px' }}>カード</label>
                    <span>¥</span>
                    <input
                      type="text"
                      value={paymentData.card ? paymentData.card.toLocaleString() : '0'}
                      onClick={() => setActivePaymentInput('card')}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: activePaymentInput === 'card' ? '2px solid #ff9800' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: activePaymentInput === 'card' ? '#fff8e1' : 'white'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ width: '80px' }}>その他</label>
                    <span>¥</span>
                    <input
                      type="text"
                      value={paymentData.other ? paymentData.other.toLocaleString() : '0'}
                      onClick={() => setActivePaymentInput('other')}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: activePaymentInput === 'other' ? '2px solid #ff9800' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: activePaymentInput === 'other' ? '#fff8e1' : 'white'
                      }}
                    />
                  </div>
                </div>
                
                {paymentData.other > 0 && (
                  <div style={{ marginLeft: '100px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      value={paymentData.otherMethod}
                      onChange={(e) => setPaymentData({...paymentData, otherMethod: e.target.value})}
                      placeholder="PayPay、LINE Pay等"
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div style={{ 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f0f8ff',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  支払合計: ¥{(paymentData.cash + paymentData.card + paymentData.other).toLocaleString()}
                </div>
                {(paymentData.cash + paymentData.card + paymentData.other) >= getRoundedTotal(getTotal()) && (
                  <div style={{ fontSize: '20px', color: '#4CAF50', fontWeight: 'bold' }}>
                    おつり: ¥{((paymentData.cash + paymentData.card + paymentData.other) - getRoundedTotal(getTotal())).toLocaleString()}
                  </div>
                )}
                {(paymentData.cash + paymentData.card + paymentData.other) > 0 && 
                 (paymentData.cash + paymentData.card + paymentData.other) < getRoundedTotal(getTotal()) && (
                  <div style={{ color: '#f44336' }}>
                    不足: ¥{(getRoundedTotal(getTotal()) - (paymentData.cash + paymentData.card + paymentData.other)).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={completeCheckout}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    opacity: (paymentData.cash + paymentData.card + paymentData.other) < getRoundedTotal(getTotal()) ? 0.6 : 1
                  }}
                  disabled={(paymentData.cash + paymentData.card + paymentData.other) < getRoundedTotal(getTotal())}
                >
                  会計完了
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ccc',
                    color: 'white',
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

            {/* 右側：数字パッド */}
            <div style={{
              width: '350px',
              backgroundColor: '#f5f5f5',
              padding: '30px',
              borderLeft: '1px solid #ddd',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* 現在の入力値表示 */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'right',
                fontSize: '32px',
                fontWeight: 'bold',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                ¥{(() => {
                  const value = activePaymentInput === 'cash' ? paymentData.cash :
                               activePaymentInput === 'card' ? paymentData.card :
                               paymentData.other;
                  return (value || 0).toLocaleString();
                })()}
              </div>

              {/* クイック金額ボタン */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => handleQuickAmount(1000)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ¥1,000
                </button>
                <button
                  onClick={() => handleQuickAmount(5000)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ¥5,000
                </button>
                <button
                  onClick={() => handleQuickAmount(10000)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ¥10,000
                </button>
              </div>

              {/* 数字パッド */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                flex: 1
              }}>
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    style={{
                      padding: '20px',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}
                
                <button
                  onClick={() => handleNumberClick('0')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  0
                </button>
                
                <button
                  onClick={() => handleNumberClick('00')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  00
                </button>
                
                <button
                  onClick={handleDeleteNumber}
                  style={{
                    padding: '20px',
                    backgroundColor: '#ffebee',
                    border: '1px solid #ffcdd2',
                    borderRadius: '8px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#d32f2f'
                  }}
                >
                  ←
                </button>
              </div>

              {/* クリアボタン */}
              <button
                onClick={handleClearNumber}
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#e0e0e0',
                  border: '1px solid #bdbdbd',
                  borderRadius: '8px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                クリア
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .label-text {
          font-weight: bold;
          margin-right: 10px;
        }
      `}</style>
    </>
  )
}