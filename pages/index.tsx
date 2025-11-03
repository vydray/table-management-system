import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ProductSection } from '../components/ProductSection'
import { OrderSection } from '../components/OrderSection'
import { TableData } from '../types'
import { getCurrentStoreId } from '../utils/storeContext'
import { calculateSubtotal, calculateServiceTax, getRoundedTotal, getRoundingAdjustment } from '../utils/calculations'
import { getJapanTimeString, getDateString } from '../utils/dateTime'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 新しいコンポーネントのインポート
import { LoadingOverlay } from '../components/LoadingOverlay'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { PaymentModal } from '../components/modals/PaymentModal'
import { SideMenu } from '../components/SideMenu'
import { Table } from '../components/Table'

// カスタムフック
import { usePayment } from '../hooks/usePayment'
import { useTableManagement } from '../hooks/useTableManagement'
import { useOrderManagement } from '../hooks/useOrderManagement'
import { useProductManagement } from '../hooks/useProductManagement'
import { useSystemConfig } from '../hooks/useSystemConfig'
import { useModalState } from '../hooks/useModalState'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { usePrinting } from '../hooks/usePrinting'
import { useCheckout } from '../hooks/useCheckout'

export default function Home() {
  const router = useRouter()

  // カスタムフック - テーブル管理
  const {
    tables,
    setTables,
    currentTable,
    setCurrentTable,
    tableLayouts,
    currentPage,
    setCurrentPage,
    maxPageNumber,
    moveMode,
    moveFromTable,
    showMoveHint,
    isMoving,
    attendingCastCount,
    occupiedTableCount,
    setOccupiedTableCount,
    loadData,
    loadTableLayouts,
    loadAttendingCastCount,
    executeMove,
    startMoveMode,
    endMoveMode,
    calculateTablePosition
  } = useTableManagement()

  // カスタムフック - 注文管理
  const {
    orderItems,
    setOrderItems,
    selectedProduct,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,
    loadOrderItems,
    saveOrderItems: saveOrderItemsFromHook,
    addProductToOrder,
    deleteOrderItem,
    updateOrderItemQuantity,
    updateOrderItemPrice
  } = useOrderManagement()

  // カスタムフック - 商品管理
  const {
    productCategories,
    castList,
    loadProducts,
    loadCastList,
    getCurrentCategoryShowOshiFirst
  } = useProductManagement()

  // カスタムフック - システム設定
  const {
    systemSettings,
    loadSystemConfig
  } = useSystemConfig()

  // カスタムフック - モーダル状態
  const {
    showModal,
    setShowModal,
    modalMode,
    setModalMode,
    showPaymentModal,
    setShowPaymentModal,
    isProcessingCheckout,
    setIsProcessingCheckout,
    showReceiptConfirm,
    setShowReceiptConfirm,
    checkoutResult,
    setCheckoutResult
  } = useModalState()

  // カスタムフック - 現在時刻
  const currentTime = useCurrentTime()

  // カスタムフック - 印刷
  const { printOrderSlip: printOrderSlipFromHook, printReceipt } = usePrinting()

  // カスタムフック - 会計処理
  const { executeCheckout } = useCheckout()

  // カスタムフック - 支払い
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

  // ローカル状態
  const [showMenu, setShowMenu] = useState(false)
  const [attendingCasts, setAttendingCasts] = useState<string[]>([])

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

  // 50音フィルター用の状態
  const [castFilter, setCastFilter] = useState('')

  // 出勤中のキャストを取得
  const loadAttendingCasts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const today = getDateString(new Date())

      const { data, error } = await supabase
        .from('attendance')
        .select('cast_name')
        .eq('store_id', storeId)
        .eq('date', today)
        .neq('cast_name', '')

      if (error) throw error

      // 重複を除いてキャスト名の配列を作成
      const castNames = [...new Set(data?.map(row => row.cast_name) || [])]
      setAttendingCasts(castNames)
    } catch (error) {
      console.error('Error loading attending casts:', error)
      setAttendingCasts([])
    }
  }

  // 合計金額を計算する関数
  const getTotal = () => {
    const subtotal = calculateSubtotal(orderItems)
    const serviceTax = calculateServiceTax(subtotal, systemSettings.serviceChargeRate)
    return subtotal + serviceTax
  }

  // 端数処理を適用した合計金額を取得
  const getRoundedTotalAmount = () => {
    return getRoundedTotal(getTotal(), systemSettings.roundingUnit, systemSettings.roundingMethod)
  }

  // 端数調整額を取得
  const getRoundingAdjustmentAmount = () => {
    return getRoundingAdjustment(getTotal(), getRoundedTotalAmount())
  }

  // 会計伝票印刷のラッパー関数
  const printOrderSlip = async () => {
    await printOrderSlipFromHook(
      currentTable,
      formData,
      tables,
      orderItems,
      systemSettings,
      getRoundedTotalAmount,
      getRoundingAdjustmentAmount
    )
  }

  
 const adjustLayoutScale = () => {
    const layout = document.getElementById('layout')
    if (!layout) return

    // レイアウトの固定サイズ
    const LAYOUT_WIDTH = 2176
    const LAYOUT_HEIGHT = 1600

    // 画面サイズを取得（余白なしでフル活用）
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 縦横比を保ちながら画面に収まる倍率を計算
    const scaleX = viewportWidth / LAYOUT_WIDTH
    const scaleY = viewportHeight / LAYOUT_HEIGHT
    const scale = Math.min(scaleX, scaleY) // 画面に収まる最適なスケールを計算

    // CSS変数として設定
    document.documentElement.style.setProperty('--viewport-scale', scale.toString())

    console.log(`Layout scale: ${scale.toFixed(3)} (viewport: ${window.innerWidth}x${window.innerHeight}, layout: ${LAYOUT_WIDTH}x${LAYOUT_HEIGHT})`)
  }

  // 注文内容を保存（ラッパー関数）
  const saveOrderItems = async (silent: boolean = false) => {
    await saveOrderItemsFromHook(currentTable, silent)
  }

  // 初期化（統合版）
  useEffect(() => {
    // ページ読み込み時に modal-open クラスを確実に削除（他ページからの遷移時のクリーンアップ）
    document.body.classList.remove('modal-open')

    // ログインチェック
    const isLoggedIn = localStorage.getItem('isLoggedIn')

    if (isLoggedIn) {
      // ログイン済みの場合のみデータを読み込む
      loadTableLayouts()
      loadSystemConfig()
      loadData()
      loadCastList()
      loadProducts()
      loadAttendingCastCount()
      loadAttendingCasts()
    }

    // ログイン済みの場合のみデータ更新間隔を設定
    let dataInterval: NodeJS.Timeout | undefined
    if (isLoggedIn) {
      dataInterval = setInterval(loadData, 10000)
    }

   // レイアウトスケール調整（初回実行）
    adjustLayoutScale()

    // リサイズイベントの設定
    const handleResize = () => {
      adjustLayoutScale()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => {
      setTimeout(adjustLayoutScale, 100)  // orientation変更後は少し待つ
    })

    return () => {
      if (dataInterval) {
        clearInterval(dataInterval)
      }

      // ===== クリーンアップも追加 ===== //
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', adjustLayoutScale)
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
const handleMenuClick = (item: string) => {
  setShowMenu(false)
  
  switch (item) {
    case 'refresh':
      loadData()
      loadCastList()
      loadProducts()
      loadTableLayouts()
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
    case 'table-layout':
      router.push('/table-layout')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      if (confirm('ログアウトしますか？')) {
        // ローカルストレージをクリア
        localStorage.removeItem('storeId')
        localStorage.removeItem('storeName')
        localStorage.removeItem('isLoggedIn')
        // ログイン画面へ遷移
        router.push('/login')
      }
      break
  }
}

  // テーブル情報更新（silent: 自動保存時はメッセージを出さない）
  const updateTableInfo = async (silent: boolean = false) => {
    try {
      // バリデーション: 必須項目チェック
      if (!silent) {
        if (!formData.visitType) {
          alert('来店種別を選択してください')
          return
        }
        if (!formData.castName) {
          alert('推しを選択してください')
          return
        }
      }

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
          guestName: formData.guestName || '無記名',  // 空の場合は「無記名」とする
          castName: formData.castName,
          timeStr,
          visitType: formData.visitType,
          storeId: storeId  // 店舗IDを追加
        })
      })

      // 卓数を更新するためにテーブル状態を再取得
      const updatedTables = { ...tables }
      updatedTables[currentTable] = {
        ...updatedTables[currentTable],
        name: formData.guestName || '無記名',  // 空の場合は「無記名」とする
        oshi: formData.castName,
        status: 'occupied',  // 必ず占有状態にする
        time: timeStr
      }
      setTables(updatedTables)

      // 現在の卓数を計算
      const occupied = Object.values(updatedTables).filter(table => table.status !== 'empty').length
      setOccupiedTableCount(occupied)

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
  const roundedTotal = getRoundedTotalAmount()

  if (totalPaid < roundedTotal) {
    alert('支払金額が不足しています')
    return
  }

  if (!confirm(`${currentTable} を会計完了にしますか？`)) return

  // ローディング開始
  setIsProcessingCheckout(true)

  try {
    // 会計処理を実行
    const result = await executeCheckout(
      currentTable,
      orderItems,
      formData,
      paymentData,
      getRoundedTotalAmount()
    )

    const updatedTables = { ...tables }
    updatedTables[currentTable] = {
      ...updatedTables[currentTable],
      name: '',
      oshi: '',
      visit: '',
      time: '',
      elapsed: '',
      status: 'empty'
    }
    setTables(updatedTables)

    // 現在の卓数を更新
    const occupied = Object.values(updatedTables).filter(table => table.status !== 'empty').length
    setOccupiedTableCount(occupied)

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
    const success = await printReceipt(
      currentTable,
      formData,
      orderItems,
      systemSettings,
      paymentData,
      checkoutResult,
      getRoundedTotalAmount,
      getRoundingAdjustmentAmount
    )

    if (!success) {
      // キャンセルされた場合
      setIsProcessingCheckout(false)
      finishCheckout()
    }
  } catch (error) {
    console.error('領収書印刷エラー:', error)
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

  // 出勤中のキャストを読み込む
  loadAttendingCasts()

  // bodyにクラスを追加
  document.body.classList.add('modal-open')

  setShowModal(true)
  setSelectedCategory('')
  setSelectedProduct(null)
}

  
  return (
    <>
      <Head>
        <title>📋 テーブル管理システム</title>
      </Head>

      <div id="layout" className="responsive-layout" onClick={(e) => {
      if (moveMode && e.target === e.currentTarget) {
      endMoveMode()
      }
      }}>
<div className="header" style={{ justifyContent: 'center' }}>
  {/* ハンバーガーメニューボタン */}
  <button 
    className="menu-button"
    onClick={() => setShowMenu(!showMenu)}
    style={{
      position: 'absolute',
      left: '10px'
    }}
  >
    <span className="menu-icon">☰</span>
  </button>
  
  {/* 差分の数字を左側に配置 */}
  <span style={{
    position: 'absolute',
    left: '170px',
    fontWeight: 'bold',
    fontSize: '24px',
    color: attendingCastCount - occupiedTableCount > 0 ? '#4CAF50' : '#F44336',
    zIndex: 100
  }}>
    {attendingCastCount - occupiedTableCount}
  </span>

  {/* タイトルは中央に */}
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
        
{/* ⭐ ページ切り替え矢印のみ（右側中央） */}
        {maxPageNumber > 1 && (
          <div style={{
            position: 'fixed',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '10px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            {/* 左矢印（前のページへ） */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: currentPage === 1 ? '#ccc' : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              ◀
            </button>
            
            {/* 現在のページ表示（オプション） */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#FF9800'
            }}>
              {currentPage}/{maxPageNumber}
            </div>
            
            {/* 右矢印（次のページへ） */}
            <button
              onClick={() => setCurrentPage(Math.min(maxPageNumber, currentPage + 1))}
              disabled={currentPage === maxPageNumber}
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: currentPage === maxPageNumber ? '#ccc' : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentPage === maxPageNumber ? 'not-allowed' : 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage === maxPageNumber ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              ▶
            </button>
          </div>
        )}
        
        {/* サイドメニューコンポーネント（元の位置のまま） */}
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
        {Object.entries(tables).map(([tableId, data]) => {
          const layout = tableLayouts.find(t => t.table_name === tableId)
          
          // ⭐ 現在のページのテーブルのみ表示
          if (!layout || (layout.page_number || 1) !== currentPage) {
            return null
          }
          
          const tableSize = layout 
            ? { width: layout.table_width, height: layout.table_height }
            : { width: 130, height: 123 } 
            
          return (
            <Table 
                key={tableId} 
                tableId={layout?.display_name || tableId} 
                data={data}
                scale={1}  // 固定値1を追加
                tableSize={tableSize}
                position={calculateTablePosition(tableId)}
                moveMode={moveMode}
                moveFromTable={moveFromTable}
                isMoving={isMoving}
                showModal={showModal}
                onOpenModal={openModal}
                onStartMoveMode={startMoveMode}
                onExecuteMove={executeMove}
            />
          )
        })}
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
          fontSize: '16px'
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
            <div id="form-fields" style={{ padding: '20px', display: 'flex', gap: '20px', height: 'calc(100% - 80px)' }}>
              {/* 左カラム: お客様情報 */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label>
                  お客様名:
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    placeholder="お客様名を入力"
                    style={{
                      width: '100%',
                      fontSize: '18px',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '2px solid #ddd',
                      marginTop: '8px'
                    }}
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
                  来店種別:
                  <select
                    value={formData.visitType}
                    onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                    style={{
                      width: '100%',
                      fontSize: '18px',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '2px solid #ddd',
                      marginTop: '8px',
                      WebkitAppearance: 'menulist',
                      appearance: 'auto',
                      touchAction: 'manipulation',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <option value="">-- 来店種別を選択 --</option>
                    <option value="初回">初回</option>
                    <option value="再訪">再訪</option>
                    <option value="常連">常連</option>
                  </select>
                </label>

                <button
                  onClick={() => updateTableInfo(false)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    marginTop: 'auto',
                    padding: '15px',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}
                >
                  決定
                </button>
              </div>

              {/* 右カラム: 推し選択 */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <label style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                  推し:
                </label>

                {/* 50音フィルターボタン */}
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  flexWrap: 'wrap',
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  {['全', 'あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'その他'].map(kana => (
                    <button
                      key={kana}
                      type="button"
                      onClick={() => setCastFilter(kana === '全' ? '' : kana)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: castFilter === (kana === '全' ? '' : kana) ? '#FF9800' : 'white',
                        color: castFilter === (kana === '全' ? '' : kana) ? 'white' : '#333',
                        border: '2px solid #FF9800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        minWidth: '45px'
                      }}
                    >
                      {kana}
                    </button>
                  ))}
                </div>

                {/* カスタムリストボックス（スクロール可能） */}
                <div
                  className="hide-scrollbar"
                  style={{
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    overflowY: 'auto',
                    backgroundColor: 'white'
                  }}
                >
                  {(() => {
                    const kanaMap: Record<string, string> = {
                      'あ': 'あいうえお',
                      'か': 'かきくけこがぎぐげご',
                      'さ': 'さしすせそざじずぜぞ',
                      'た': 'たちつてとだぢづでど',
                      'な': 'なにぬねの',
                      'は': 'はひふへほばびぶべぼぱぴぷぺぽ',
                      'ま': 'まみむめも',
                      'や': 'やゆよ',
                      'ら': 'らりるれろ',
                      'わ': 'わをん'
                    }

                    const filteredCasts = castList.filter(name => {
                      if (!castFilter) return true
                      const firstChar = name.charAt(0)

                      // 「その他」フィルター: ひらがな以外の名前を表示
                      if (castFilter === 'その他') {
                        const allKana = Object.values(kanaMap).join('')
                        return !allKana.includes(firstChar)
                      }

                      return kanaMap[castFilter]?.includes(firstChar)
                    })

                    return (
                      <>
                        <div
                          onClick={() => setFormData({ ...formData, castName: '' })}
                          style={{
                            padding: '12px 15px',
                            fontSize: '18px',
                            cursor: 'pointer',
                            backgroundColor: formData.castName === '' ? '#FF9800' : 'white',
                            color: formData.castName === '' ? 'white' : '#999',
                            borderBottom: '1px solid #eee',
                            fontStyle: formData.castName === '' ? 'normal' : 'italic'
                          }}
                        >
                          -- 推しを選択 --
                        </div>
                        {filteredCasts.map(name => (
                          <div
                            key={name}
                            onClick={() => setFormData({ ...formData, castName: name })}
                            style={{
                              padding: '12px 15px',
                              fontSize: '18px',
                              cursor: 'pointer',
                              backgroundColor: formData.castName === name ? '#FF9800' : 'white',
                              color: formData.castName === name ? 'white' : '#333',
                              borderBottom: '1px solid #eee',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            {name}
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          ) : (
                      <div id="details">
              <div className="order-section">

                {/* 入店日時エリア - 元のまま */}
                <div className="datetime-edit" style={{
                  fontSize: window.innerWidth <= 1024 ? '14px' : '16px',
                  padding: window.innerWidth <= 1024 ? '10px 15px' : '15px 20px',
                  justifyContent: 'center',
                  borderBottom: '1px solid #ddd',
                  marginBottom: 0
                }}>
                  <span className="label-text" style={{ 
                    fontSize: window.innerWidth <= 1024 ? '14px' : '16px'
                  }}>
                    入店日時：
                  </span>
                  <select
                    className="date-select"
                    value={formData.editYear}
                    onChange={(e) => {
                      setFormData({ ...formData, editYear: parseInt(e.target.value) })
                      updateTableInfo(true)
                    }}
                    size={window.innerWidth <= 1024 ? 5 : 1}
                  >
                    {[2024, 2025].map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                  <select
                    className="date-select"
                    value={formData.editMonth}
                    onChange={(e) => {
                      setFormData({ ...formData, editMonth: parseInt(e.target.value) })
                      updateTableInfo(true)
                    }}
                    size={window.innerWidth <= 1024 ? 8 : 1}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                  <select
                    className="date-select"
                    value={formData.editDate}
                    onChange={(e) => {
                      setFormData({ ...formData, editDate: parseInt(e.target.value) })
                      updateTableInfo(true)
                    }}
                    size={window.innerWidth <= 1024 ? 10 : 1}
                  >
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
                    size={window.innerWidth <= 1024 ? 10 : 1}
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
                    size={window.innerWidth <= 1024 ? 8 : 1}
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(min => (
                      <option key={min} value={min}>{min.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <div className="pos-container" style={{
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                  width: '100%',
                  height: 'auto',
                  padding: '20px',
                  gap: '20px'
                }}>
                  <ProductSection
                    productCategories={productCategories}
                    selectedCategory={selectedCategory}
                    selectedProduct={selectedProduct}
                    castList={castList}
                    attendingCasts={attendingCasts}
                    currentOshi={formData.castName}
                    showOshiFirst={getCurrentCategoryShowOshiFirst(selectedCategory)}
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
                    subtotal={calculateSubtotal(orderItems)}
                    serviceTax={calculateServiceTax(calculateSubtotal(orderItems), systemSettings.serviceChargeRate)}
                    roundedTotal={getRoundedTotalAmount()}
                    roundingAdjustment={getRoundingAdjustmentAmount()}
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
        layoutScale={1}
        paymentData={paymentData}
        activePaymentInput={activePaymentInput}
        subtotal={calculateSubtotal(orderItems)}
        serviceTax={calculateServiceTax(calculateSubtotal(orderItems), systemSettings.serviceChargeRate)}
        total={getTotal()}
        roundedTotal={getRoundedTotalAmount()}
        roundingAdjustment={getRoundingAdjustmentAmount()}
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