import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ProductSection } from '../components/ProductSection'
import { OrderSection } from '../components/OrderSection'
import { TableData, OrderItem, ProductCategories, ProductCategory, Product } from '../types'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'
import { printer } from '../utils/bluetoothPrinter'

// 新しいコンポーネントのインポート
import { LoadingOverlay } from '../components/LoadingOverlay'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { PaymentModal } from '../components/modals/PaymentModal'
import { SideMenu } from '../components/SideMenu'
import { Table } from '../components/Table'
import { usePayment } from '../hooks/usePayment'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  
  // レスポンシブ用のスケール状態を追加
  const [layoutScale, setLayoutScale] = useState(1)
  const [tableBaseSize, setTableBaseSize] = useState({ width: 130, height: 123 })
  
  // POS機能用の状態
  const [productCategories, setProductCategories] = useState<ProductCategories>({})
  const [productCategoriesData, setProductCategoriesData] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<{name: string, price: number, needsCast: boolean} | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // 会計モーダル用の状態（カスタムフックを使用）
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const {
    paymentData,
    activePaymentInput,
    setActivePaymentInput,
    handleNumberClick,
    handleQuickAmount,
    handleDeleteNumber,
    handleClearNumber,
    resetPaymentData,
    setOtherMethod
  } = usePayment()

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
  const isLongPress = useRef(false)

  // ローディングと領収書確認用の状態
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [showReceiptConfirm, setShowReceiptConfirm] = useState(false)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)

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

  const printOrderSlip = async () => {
    try {
      // プリンター接続を確認
      const isConnected = await printer.checkConnection();
      if (!isConnected) {
        if (confirm('プリンターが接続されていません。設定画面で接続しますか？')) {
          router.push('/settings?tab=receipt');
        }
        return;
      }

      // 現在の時刻を取得
      const now = new Date();
      const timestamp = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // 印刷データを準備
      const orderData = {
        tableName: currentTable,
        guestName: formData.guestName || '（未入力）',
        castName: formData.castName || '（未選択）',
        elapsedTime: tables[currentTable]?.elapsed || '0分',
        orderItems: orderItems,
        subtotal: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        serviceTax: Math.floor(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * systemSettings.serviceChargeRate),
        roundedTotal: getRoundedTotal(getTotal()),
        roundingAdjustment: getRoundingAdjustment(),
        timestamp: timestamp
      };

      // 印刷実行
      await printer.printOrderSlip(orderData);
      alert('会計伝票を印刷しました');
    } catch (error) {
      console.error('Print error:', error);
      // エラーオブジェクトの型チェック
      if (error instanceof Error) {
        alert('印刷に失敗しました: ' + error.message);
      } else {
        alert('印刷に失敗しました: Unknown error');
      }
    }
  };

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
      
      // ログインチェック
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (!isLoggedIn) {
        console.log('未ログインのため商品データ読み込みをスキップ')
        return
      }
      
      // 店舗IDを取得
      const storeId = getCurrentStoreId()
      if (!storeId) {
        console.log('店舗IDが取得できないため商品データ読み込みをスキップ')
        return
      }
      
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
      // ログイン前は警告を表示しない
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (isLoggedIn) {
        alert('商品データの読み込みに失敗しました')
      }
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
      
      // 取得したデータで更新（tablePositionsに存在するテーブルのみ）
      data.forEach(item => {
        // tablePositionsに定義されているテーブルのみ処理
        if (!(item.table in tablePositions)) {
          console.warn(`未定義のテーブル「${item.table}」をスキップしました`)
          return
        }
        
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

  // 初期化（統合版）
  useEffect(() => {
    // ログインチェック
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    
    if (isLoggedIn) {
      // ログイン済みの場合のみデータを読み込む
      loadSystemSettings()
      loadData()
      loadCastList()
      loadProducts()
    }
    
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
    
    // ログイン済みの場合のみデータ更新間隔を設定
    let dataInterval: NodeJS.Timeout | undefined
    if (isLoggedIn) {
      dataInterval = setInterval(loadData, 10000)
    }
    
    return () => {
      clearInterval(timeInterval)
      if (dataInterval) {
        clearInterval(dataInterval)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ビューポート高さの動的設定（Android対応）
  useEffect(() => {
    const setViewportHeight = () => {
      // 実際のビューポート高さを取得
      const vh = window.innerHeight * 0.01;
      // CSS変数として設定
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 初回設定
    setViewportHeight();

    // リサイズ時に再計算
    window.addEventListener('resize', setViewportHeight);
    
    // Android Chromeでのアドレスバー対応
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
    });

    // モーダルが開いた時の処理を追加
    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target as HTMLElement;
        if (target.id === 'modal' && target.style.display !== 'none') {
          // モーダルが表示されたら高さを再計算
          setTimeout(setViewportHeight, 0);
          
          // Androidでのスクロール位置リセット
          const details = document.querySelector('#modal #details') as HTMLElement;
          if (details) {
            details.scrollTop = 0;
          }
          
          // モーダル内のフォーカス管理
          const firstInput = target.querySelector('input, select') as HTMLElement;
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
          }
        }
      });
    });

    // モーダルの監視開始
    const modal = document.getElementById('modal');
    if (modal) {
      modalObserver.observe(modal, { 
        attributes: true, 
        attributeFilter: ['style'] 
      });
    }

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      modalObserver.disconnect();
    };
  }, []);

  // レイアウトのスケール計算（親コンポーネントで一度だけ）
  useEffect(() => {
    const calculateLayoutScale = () => {
      const layout = document.getElementById('layout')
      if (!layout) return
      
      const layoutRect = layout.getBoundingClientRect()
      const baseWidth = 1024
      const baseHeight = 768
      const headerHeight = 72
      
      // 使用可能な高さ
      const availableHeight = layoutRect.height - headerHeight
      
      // スケール計算
      const scaleX = layoutRect.width / baseWidth
      const scaleY = availableHeight / (baseHeight - headerHeight)
      const scale = Math.min(scaleX, scaleY, 1)
      
      setLayoutScale(scale)
      setTableBaseSize({
        width: Math.round(130 * scale),
        height: Math.round(123 * scale)
      })
      
      // CSS変数として設定
      layout.style.setProperty('--scale-factor', scale.toString())
    }
    
    // 初回計算
    calculateLayoutScale()
    
    // リサイズ時の再計算（ただしフォーカスイベントを除外）
    let resizeTimer: NodeJS.Timeout
    let lastHeight = window.innerHeight
    
    const handleResize = () => {
      // キーボード表示によるリサイズを無視（高さが大きく変わった場合）
      const heightDiff = Math.abs(window.innerHeight - lastHeight)
      if (heightDiff > 100) {
        // キーボードの表示/非表示と判断
        lastHeight = window.innerHeight
        return
      }
      
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        calculateLayoutScale()
        lastHeight = window.innerHeight
      }, 300)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
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
      document.body.classList.remove('modal-open')  // 追加
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
    resetPaymentData()
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
  
  // ローディング開始
  setIsProcessingCheckout(true)
  
  try {
    const checkoutTime = getJapanTimeString(new Date())
    const storeId = getCurrentStoreId()
    
    // まずAPIで会計処理を実行
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
        storeId: storeId
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Checkout failed')
    }
    
    // 結果を保存
    setCheckoutResult(result)
    
    // 会計モーダルを先に閉じる
    document.body.classList.remove('modal-open')
    setShowPaymentModal(false)
    
    // ローディングを一旦終了してから領収書確認モーダルを表示
    setIsProcessingCheckout(false)
    
    // 少し遅延を入れて領収書確認モーダルを表示
    setTimeout(() => {
      setShowReceiptConfirm(true)
    }, 100)
    
  } catch (error) {
    console.error('Error checkout:', error)
    alert('会計処理に失敗しました')
    setIsProcessingCheckout(false)
  }
}

// 領収書印刷処理（別関数として定義）
const handleReceiptPrint = async () => {
  setShowReceiptConfirm(false)
  
  // 印刷処理開始時にローディングを表示
  setIsProcessingCheckout(true)
  
  try {
    const storeId = getCurrentStoreId()
    
    // 宛名と但し書きの入力
    const receiptTo = prompt('宛名を入力してください（空欄可）:', formData.guestName || '') || ''
    
    // キャンセルされた場合
    if (receiptTo === null) {
      setIsProcessingCheckout(false)
      finishCheckout()
      return
    }
    
    // 設定から但し書きテンプレートを取得
    const { data: receiptSettings } = await supabase
      .from('receipt_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();
    
    // デフォルトの但し書きを取得
    let defaultReceiptNote = 'お品代として';
    if (receiptSettings?.receipt_templates && Array.isArray(receiptSettings.receipt_templates)) {
      const defaultTemplate = receiptSettings.receipt_templates.find((t: { is_default: boolean }) => t.is_default);
      if (defaultTemplate) {
        defaultReceiptNote = defaultTemplate.text;
      }
    }
    
    const receiptNote = prompt('但し書きを入力してください:', defaultReceiptNote) || defaultReceiptNote;
    
    // 新しく接続を確立
    await printer.enable();
    
    // ペアリング済みデバイスを取得
    const devices = await printer.getPairedDevices();
    const mpb20 = devices.find(device => 
      device.name && device.name.toUpperCase().includes('MP-B20')
    );
    
    if (mpb20) {
      // 接続
      await printer.connect(mpb20.address);
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 印刷データを準備
      const now = new Date();
      const timestamp = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const serviceTax = Math.floor(subtotal * systemSettings.serviceChargeRate);
      const consumptionTax = Math.floor((subtotal + serviceTax) * systemSettings.consumptionTaxRate);
      
      // 領収書印刷（設定値を使用）
      await printer.printReceipt({
        // 店舗情報（設定から取得）
        storeName: receiptSettings?.store_name || '店舗名',
        storeAddress: receiptSettings?.store_address || '',
        storePhone: receiptSettings?.store_phone || '',
        storePostalCode: receiptSettings?.store_postal_code || '',
        storeRegistrationNumber: receiptSettings?.store_registration_number || '',
        
        // 領収書情報
        receiptNumber: checkoutResult?.receiptNumber || `R${Date.now()}`,
        receiptTo: receiptTo,  // 宛名
        receiptNote: receiptNote,  // 但し書き
        
        // 収入印紙設定（設定から取得）
        showRevenueStamp: receiptSettings?.show_revenue_stamp ?? true,
        revenueStampThreshold: receiptSettings?.revenue_stamp_threshold || 50000,
        
        // 会計情報
        tableName: currentTable,
        guestName: formData.guestName || '（未入力）',
        castName: formData.castName || '（未選択）',
        timestamp: timestamp,
        orderItems: orderItems,
        subtotal: subtotal,
        serviceTax: serviceTax,
        consumptionTax: consumptionTax,
        roundingAdjustment: getRoundingAdjustment(),
        roundedTotal: getRoundedTotal(getTotal()),
        paymentCash: paymentData.cash,
        paymentCard: paymentData.card,
        paymentOther: paymentData.other,
        paymentOtherMethod: paymentData.otherMethod,
        change: (paymentData.cash + paymentData.card + paymentData.other) - getRoundedTotal(getTotal())
      });
      
      // 印刷後に切断
      await printer.disconnect();
      
    } else {
      alert('MP-B20が見つかりません。');
    }
  } catch (printError) {
    console.error('領収書印刷エラー:', printError);
    const errorMessage = printError instanceof Error 
      ? printError.message 
      : '不明なエラーが発生しました';
    alert('領収書印刷に失敗しました。\n' + errorMessage);
  } finally {
    // 会計処理を完了
    finishCheckout()
  }
}

// 会計処理の完了（共通処理）
const finishCheckout = () => {
  // ローディングを終了
  setIsProcessingCheckout(false)
  
  // 各種状態をリセット
  setOrderItems([])
  setShowModal(false)
  setCheckoutResult(null)
  setShowReceiptConfirm(false)
  
  // データを再読み込み
  loadData()
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
    
    document.body.classList.remove('modal-open')  // 追加
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
          onMenuClick={handleMenuClick}
        />
        
        {showMoveHint && (
          <div id="move-hint">
            🔄 移動先の空席をタップしてください（キャンセル：画面外をタップ）
          </div>
        )}
        
        {/* テーブルコンポーネント */}
        {Object.entries(tables).map(([tableId, data]) => (
          <Table 
            key={tableId} 
            tableId={tableId} 
            data={data}
            scale={layoutScale}
            tableSize={tableBaseSize}
            position={calculateTablePosition(tableId)}
            moveMode={moveMode}
            moveFromTable={moveFromTable}
            isMoving={isMoving}
            showModal={showModal}
            onOpenModal={openModal}
            onStartMoveMode={startMoveMode}
            onExecuteMove={executeMove}
          />
        ))}
      </div>

      {/* モーダルオーバーレイ */}
      {showModal && (
  <div 
    id="modal-overlay" 
    onClick={() => {
      document.body.classList.remove('modal-open')
      setShowModal(false)
    }} 
  />
)}

      {/* メインモーダル（既存のまま） */}
      {showModal && (
        <div id="modal" className={modalMode === 'new' ? 'modal-new' : 'modal-edit'} style={{
          fontSize: `${16 * layoutScale}px`
        }}>
          {/* 既存のモーダル内容をそのまま残す（長いので省略） */}
          <button 
  id="modal-close" 
  onClick={() => {
    document.body.classList.remove('modal-open')
    setShowModal(false)
  }}
>
  ×
</button>
          <h3 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            margin: 0,
            padding: window.innerWidth <= 1024 ? '12px 15px' : '20px',
            background: '#ff9800',
            color: 'white',
            fontSize: window.innerWidth <= 1024 ? '16px' : '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              📌 {currentTable} の操作
              {modalMode === 'edit' && (
                <span style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#000'
                }}>
                  滞在時間: {tables[currentTable]?.elapsed || '0分'}
                </span>
              )}
            </div>
            {modalMode === 'edit' && orderItems.length > 0 && (
              <button
                onClick={printOrderSlip}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                🖨️ 会計伝票印刷
              </button>
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
                  onFocus={(e) => {
                    // Androidでキーボード表示時のスクロール位置調整
                    if (window.innerWidth <= 1024) {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 300)
                    }
                  }}
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

                {/* 入店日時エリア - 元のまま */}
                <div className="datetime-edit" style={{
                  fontSize: window.innerWidth <= 1024 ? '14px' : `${16 * layoutScale}px`,
                  padding: window.innerWidth <= 1024 ? '10px 15px' : `${15 * layoutScale}px ${20 * layoutScale}px`,
                  justifyContent: 'center',
                  borderBottom: '1px solid #ddd',
                  marginBottom: 0
                }}>
                  <span className="label-text" style={{ 
                    fontSize: window.innerWidth <= 1024 ? '14px' : `${16 * layoutScale}px` 
                  }}>
                    入店日時：
                  </span>
                  <select className="date-select" value={formData.editYear} onChange={(e) => {
                    setFormData({ ...formData, editYear: parseInt(e.target.value) })
                    updateTableInfo(true)
                  }}>
                    {[2024, 2025].map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                  <select className="date-select" value={formData.editMonth} onChange={(e) => {
                    setFormData({ ...formData, editMonth: parseInt(e.target.value) })
                    updateTableInfo(true)
                  }}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                  <select className="date-select" value={formData.editDate} onChange={(e) => {
                    setFormData({ ...formData, editDate: parseInt(e.target.value) })
                    updateTableInfo(true)
                  }}>
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}日</option>
                    ))}
                  </select>
                  <select 
                    value={formData.editHour}
                    onChange={(e) => {
                      setFormData({ ...formData, editHour: parseInt(e.target.value) })
                      updateTableInfo(true)
                    }}
                    className="time-select"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select 
                    value={formData.editMinute}
                    onChange={(e) => {
                      setFormData({ ...formData, editMinute: parseInt(e.target.value) })
                      updateTableInfo(true)
                    }}
                    className="time-select"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(min => (
                      <option key={min} value={min}>{min.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <div className="pos-container" style={{
                  transform: `scale(${layoutScale})`,
                  transformOrigin: 'top left',
                  width: `${100 / layoutScale}%`,
                  height: 'auto',
                  padding: `${20 * layoutScale}px`,
                  gap: `${20 * layoutScale}px`
                }}>
                  <ProductSection
                    productCategories={productCategories}
                    selectedCategory={selectedCategory}
                    selectedProduct={selectedProduct}
                    castList={castList}
                    currentOshi={formData.castName}
                    showOshiFirst={getCurrentCategoryShowOshiFirst()}
                    onSelectCategory={(category) => {
                      setSelectedCategory(category)
                      // カテゴリー変更時に商品選択をクリア
                      setSelectedProduct(null)
                    }}
                    onAddProduct={addProductToOrder}
                  />
                  
                  <OrderSection
                    orderItems={orderItems}
                    onCheckout={checkout}
                    onClearTable={clearTable}
                    onUpdateOrderItem={updateOrderItemQuantity}
                    onDeleteOrderItem={deleteOrderItem}
                    onUpdateOrderItemPrice={updateOrderItemPrice}
                    /* 変更部分: castName, guestNameを削除して、formDataとonUpdateFormDataを追加 */
                    formData={formData}
                    onUpdateFormData={(updates) => {
                      setFormData({ ...formData, ...updates })
                      updateTableInfo(true)
                    }}
                    /* ここまで変更 */
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

      {/* 会計モーダル（PaymentModalコンポーネント使用） */}
      <PaymentModal
        isOpen={showPaymentModal}
        currentTable={currentTable}
        layoutScale={layoutScale}
        paymentData={paymentData}
        activePaymentInput={activePaymentInput}
        subtotal={orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
        serviceTax={Math.floor(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * systemSettings.serviceChargeRate)}
        total={getTotal()}
        roundedTotal={getRoundedTotal(getTotal())}
        roundingAdjustment={getRoundingAdjustment()}
        formData={formData}
        onNumberClick={handleNumberClick}
        onQuickAmount={handleQuickAmount}
        onDeleteNumber={handleDeleteNumber}
        onClearNumber={handleClearNumber}
        onChangeActiveInput={setActivePaymentInput}
        onChangeOtherMethod={setOtherMethod}
        onCompleteCheckout={completeCheckout}
        onClose={() => {
          document.body.classList.remove('modal-open')
          setShowPaymentModal(false)
        }}
      />
      
      {/* 領収書確認モーダル - 他のモーダルより後に配置 */}
      <ConfirmModal
        isOpen={showReceiptConfirm}
        message="領収書を印刷しますか？"
        onConfirm={handleReceiptPrint}
        onCancel={finishCheckout}
      />
      
      {/* ローディングオーバーレイ - 最後に配置で最前面 */}
      <LoadingOverlay 
        isLoading={isProcessingCheckout} 
        message="会計処理中..." 
      />

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
        
        /* Androidタブレット用のモーダル修正 */
        @media screen and (max-width: 1024px) {
          /* 1. ヘッダー（操作 滞在時間）の縦幅を狭く */
          #modal.modal-edit h3 {
            padding: 12px 15px !important;
            font-size: 16px !important;
          }
          
          /* 2. 入店日時エリアの縦幅を狭く */
          #modal.modal-edit .datetime-edit {
            padding: 10px 15px !important;
            font-size: 14px !important;
            min-height: auto !important;
          }
          
          #modal.modal-edit .datetime-edit .label-text {
            font-size: 14px !important;
          }
          
          #modal.modal-edit .datetime-edit select {
            font-size: 13px !important;
            padding: 4px 6px !important;
          }
          
          /* 3. POSコンテナのレイアウト調整 */
          #modal.modal-edit .pos-container {
            display: flex !important;
            flex-direction: row !important;
            gap: 10px !important;
            padding: 10px !important;
            height: calc(100% - 100px) !important;
          }
          
          /* 左側（商品選択）を少し狭く */
          #modal.modal-edit .left-section {
            width: 45% !important;
            padding: 12px !important;
          }
          
          /* 右側（注文・会計）を少し広く */
          #modal.modal-edit .right-section {
            width: 55% !important;
            padding: 12px !important;
          }
          
          /* モーダル全体の高さ調整 */
          #modal.modal-edit {
            height: 92% !important;
            max-height: 92vh !important;
          }
          
          #modal.modal-edit #details {
            height: calc(100% - 50px) !important;
          }
        }
      `}</style>
    </>
  )
}