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

  // 伝票一覧を読み込む
  const loadReceipts = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const startOfDay = `${selectedDate} 00:00:00`
      const endOfDay = `${selectedDate} 23:59:59`

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
        .gte('checkout_datetime', startOfDay)
        .lte('checkout_datetime', endOfDay)
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

  // 日付変更時
  useEffect(() => {
    loadReceipts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

// 伝票選択時
  useEffect(() => {
    if (selectedReceipt) {
      loadOrderItems(selectedReceipt.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReceipt])

  return (
    <>
      <Head>
        <title>📋 伝票管理 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{ 
        width: '1024px',
        height: '768px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100%'
        }}>
          {/* 左サイドバー */}
          <div style={{
            width: '350px',
            backgroundColor: '#fff',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            {/* ヘッダー */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              background: 'linear-gradient(to bottom, #ffffff, #f8f8f8)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    marginRight: '15px',
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ←
                </button>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  📋 伝票管理
                </h1>
              </div>

              {/* 日付選択 */}
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff9800'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            {/* 伝票リスト */}
            <ReceiptList 
              receipts={receipts}
              selectedReceipt={selectedReceipt}
              loading={loading}
              onSelectReceipt={setSelectedReceipt}
            />
          </div>

          {/* 右側詳細 */}
          <div style={{
            flex: 1,
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
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