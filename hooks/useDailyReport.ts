import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

export interface DailyReportData {
  date: string
  eventName: string
  weather?: string
  totalReceipt: number
  totalSales: number
  cashReceipt: number
  cardReceipt: number
  payPayReceipt: number
  otherSales: number
  notTransmittedReceipt: number
  notTransmittedAmount: number
  unpaidAmount: number
  incomeAmount: number
  expenseAmount: number
  balance: number
  staffCount: number
  castCount: number
  remarks: string
  twitterFollowers: number
  instagramFollowers: number
  tiktokFollowers: number
  dailyPaymentTotal: number
}

export const useDailyReport = () => {
  const [dailyReportData, setDailyReportData] = useState<DailyReportData>({
    date: '',
    eventName: '',
    totalReceipt: 0,
    totalSales: 0,
    cashReceipt: 0,
    cardReceipt: 0,
    payPayReceipt: 0,
    otherSales: 0,
    notTransmittedReceipt: 0,
    notTransmittedAmount: 0,
    unpaidAmount: 0,
    incomeAmount: 0,
    expenseAmount: 0,
    balance: 0,
    staffCount: 0,
    castCount: 0,
    remarks: '',
    twitterFollowers: 0,
    instagramFollowers: 0,
    tiktokFollowers: 0,
    dailyPaymentTotal: 0
  })

  const [showDailyReportModal, setShowDailyReportModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  // 日報データを読み込み
  const loadDailyReport = async (businessDate: string) => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('store_id', storeId)
        .eq('business_date', businessDate)
        .single()

      if (data) {
        // 売上データは常にリアルタイムで計算されるため、調整項目とSNSデータだけを更新
        // 日付は上書きしない（openDailyReportで設定済み）
        // DBのカラム名に合わせる
        setDailyReportData(prev => ({
          ...prev,
          eventName: data.event_name || '',
          weather: data.weather,
          notTransmittedReceipt: data.unknown_receipt || 0,
          notTransmittedAmount: data.unknown_amount || 0,
          unpaidAmount: data.unpaid_amount || 0,
          expenseAmount: data.expense_amount || 0,
          remarks: data.remarks || '',
          twitterFollowers: data.twitter_followers || 0,
          instagramFollowers: data.instagram_followers || 0,
          tiktokFollowers: data.tiktok_followers || 0,
          dailyPaymentTotal: data.daily_payment_total || 0
        }))
      }
    } catch (error) {
      console.error('Error loading daily report:', error)
    }
  }

  // 日報を保存
  const saveDailyReport = async () => {
    try {
      setIsUpdating(true)
      const storeId = getCurrentStoreId()

      // DBのカラム名に合わせる
      const reportToSave = {
        store_id: storeId,
        business_date: dailyReportData.date,
        event_name: dailyReportData.eventName,
        weather: dailyReportData.weather,
        order_count: dailyReportData.totalReceipt,
        total_sales: dailyReportData.totalSales,
        cash_sales: dailyReportData.cashReceipt,
        card_sales: dailyReportData.cardReceipt,
        other_sales: dailyReportData.otherSales,
        unknown_receipt: dailyReportData.notTransmittedReceipt,
        unknown_amount: dailyReportData.notTransmittedAmount,
        unpaid_amount: dailyReportData.unpaidAmount,
        expense_amount: dailyReportData.expenseAmount,
        staff_count: dailyReportData.staffCount,
        cast_count: dailyReportData.castCount,
        remarks: dailyReportData.remarks,
        twitter_followers: dailyReportData.twitterFollowers,
        instagram_followers: dailyReportData.instagramFollowers,
        tiktok_followers: dailyReportData.tiktokFollowers,
        daily_payment_total: dailyReportData.dailyPaymentTotal
      }

      const { error } = await supabase
        .from('daily_reports')
        .upsert(reportToSave, {
          onConflict: 'store_id,business_date'
        })

      if (error) throw error

      alert('日報を保存しました')
      setShowDailyReportModal(false)
    } catch (error) {
      console.error('Error saving daily report:', error)
      alert('保存に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    // State
    dailyReportData,
    setDailyReportData,
    showDailyReportModal,
    setShowDailyReportModal,
    selectedDate,
    setSelectedDate,
    isUpdating,

    // Functions
    loadDailyReport,
    saveDailyReport
  }
}
