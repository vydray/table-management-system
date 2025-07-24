import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'
import ReceiptList from '../components/receipts/ReceiptList'
import ReceiptDetail from '../components/receipts/ReceiptDetail'
import { Receipt, OrderItem } from '../types/receipt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Receipts() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5) // デフォルト5時

  // 営業日切り替え時間を取得
  const loadBusinessDayStartHour = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'business_day_start_hour')
        .eq('store_id', storeId)
        .single()
      
      if (data) {
        setBusinessDayStartHour(parseInt(data.setting_value))
      }
    } catch (error) {
      console.error('Error loading business day start hour:', error)
    }
  }

  // 営業日の開始・終了時刻を計算
  const getBusinessDayRange = (date: string) => {
    const targetDate = new Date(date)
    
    // 開始時刻（当日の営業開始時間）
    const start = new Date(targetDate)
    start.setHours(businessDayStartHour, 0, 0, 0)
    
    // 終了時刻（翌日の営業開始時間）
    const end = new Date(targetDate)
    end.setDate(end.getDate() + 1)
    end.setHours(businessDayStartHour, 0, 0, 0)
    
    return { 
      start: start.toISOString(), 
      end: end.toISOString() 
    }
  }

  // 伝票一覧を読み込む
  const loadReceipts = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const { start, end } = getBusinessDayRange(selectedDate)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          receipt_number,
          checkout_datetime,
          table_number,
          total_incl_tax,
          guest_name,
          staff_name,
          deleted_at,
          deleted_by
        `)
        .eq('store_id', storeId)
        .not('checkout_datetime', 'is', null)
        .gte('checkout_datetime', start)
        .lt('checkout_datetime', end)
        .order('checkout_datetime', { ascending: false })

      if (error) throw error

      setReceipts(data || [])
      
      // 最初の伝票を自動選択
      if (data && data.length > 0 && !selectedReceipt) {
        setSelectedReceipt(data[0])
      }
    } catch (error) {
      console.error('Error loading receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 伝票詳細（注文明細）を読み込む
  const loadOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at')

      if (error) throw error
      setOrderItems(data || [])
    } catch (error) {
      console.error('Error loading order items:', error)
    }
  }

  // 伝票を削除（論理削除）
  const deleteReceipt = async (receiptId: string) => {
    if (!confirm('この伝票を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: 1 // TODO: 実際のユーザーIDを使用
        })
        .eq('id', receiptId)

      if (error) throw error

      alert('伝票を削除しました')
      loadReceipts()
      setSelectedReceipt(null)
    } catch (error) {
      console.error('Error deleting receipt:', error)
      alert('削除に失敗しました')
    }
  }

  // 初期読み込み
  useEffect(() => {
    loadBusinessDayStartHour()
  }, [])

  // 日付変更時
  useEffect(() => {
    if (businessDayStartHour !== null) {
      loadReceipts()
    }
  }, [selectedDate, businessDayStartHour])

  // 伝票選択時
  useEffect(() => {
    if (selectedReceipt) {
      loadOrderItems(selectedReceipt.id)
    }
  }, [selectedReceipt])

  return (
    <>
      <Head>
        <title>📋 伝票管理 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#607D8B',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px',
            fontWeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 伝票管理
          </h1>
        </div>

        <div style={{
          display: 'flex',
          width: '100%',
          height: 'calc(100vh - 54px)'
        }}>
          {/* 左側：伝票一覧 */}
          <div style={{ 
            width: '400px',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f9f9f9'
            }}>
              <h2 style={{ margin: 0, marginBottom: '15px', fontSize: '20px' }}>
                📋 伝票履歴
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: 'white'
                }}
              />
              <div style={{
                marginTop: '5px',
                fontSize: '12px',
                color: '#666'
              }}>
                ※ 営業日（{businessDayStartHour}時〜翌{businessDayStartHour}時）の伝票を表示
              </div>
            </div>
            
            <ReceiptList
              receipts={receipts}
              selectedReceipt={selectedReceipt}
              onSelectReceipt={setSelectedReceipt}
              loading={loading}
            />
          </div>

          {/* 右側：伝票詳細 */}
          <div style={{ 
            flex: 1,
            backgroundColor: '#fff',
            overflow: 'hidden'
          }}>
            <ReceiptDetail
              selectedReceipt={selectedReceipt}
              orderItems={orderItems}
              onDelete={deleteReceipt}
            />
          </div>
        </div>
      </div>
    </>
  )
}