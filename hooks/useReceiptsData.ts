import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId, getCurrentUserId } from '../utils/storeContext'
import { getBusinessDayRangeDates } from '../utils/dateTime'
import { Receipt, OrderItem } from '../types/receipt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useReceiptsData = () => {
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

  // 伝票一覧を読み込む
  const loadReceipts = async (selectedDate: string) => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const targetDate = new Date(selectedDate)
      const { start, end } = getBusinessDayRangeDates(targetDate, businessDayStartHour)

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
        .gte('checkout_datetime', start.toISOString())
        .lt('checkout_datetime', end.toISOString())
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
      const userId = getCurrentUserId()
      const { error } = await supabase
        .from('orders')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', receiptId)

      if (error) throw error

      alert('伝票を削除しました')
      setSelectedReceipt(null)
      return true
    } catch (error) {
      console.error('Error deleting receipt:', error)
      alert('削除に失敗しました')
      return false
    }
  }

  return {
    // State
    receipts,
    setReceipts,
    selectedReceipt,
    setSelectedReceipt,
    orderItems,
    loading,
    businessDayStartHour,

    // Functions
    loadBusinessDayStartHour,
    loadReceipts,
    loadOrderItems,
    deleteReceipt
  }
}
