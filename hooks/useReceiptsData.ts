import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId, getCurrentUserId } from '../utils/storeContext'
import { getBusinessDayRangeDates } from '../utils/dateTime'
import { Receipt, OrderItem } from '../types/receipt'

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
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'business_day_start_hour')
        .eq('store_id', storeId)
        .single()

      if (!error && data) {
        setBusinessDayStartHour(parseInt(data.setting_value))
      }
    } catch {
      // エラー時はデフォルト値を使用
    }
  }

  // 伝票一覧を読み込む
  const loadReceipts = async (selectedDate: string) => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const targetDate = new Date(selectedDate + 'T00:00:00')
      const { start, end } = getBusinessDayRangeDates(targetDate, businessDayStartHour)

      // タイムゾーン変換なしで文字列比較するため、YYYY-MM-DD HH:mm:ss形式に変換
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }

      const startStr = formatDateTime(start)
      const endStr = formatDateTime(end)

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
        .gte('checkout_datetime', startStr)
        .lt('checkout_datetime', endStr)
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
    if (!confirm('この伝票を削除してもよろしいですか？')) return false

    try {
      const userId = getCurrentUserId()

      // ユーザーIDのチェック
      if (!userId || userId === 0) {
        console.error('User ID not found')
        alert('ユーザー情報が取得できません。再ログインしてください。')
        return false
      }

      const { error } = await supabase
        .from('orders')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', receiptId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      alert('伝票を削除しました')
      setSelectedReceipt(null)
      return true
    } catch (error: any) {
      console.error('Error deleting receipt:', error)
      alert(`削除に失敗しました: ${error?.message || '不明なエラー'}`)
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
