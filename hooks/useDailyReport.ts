import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DailyReportData {
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
        setDailyReportData({
          date: data.business_date,
          eventName: data.event_name || '',
          weather: data.weather,
          totalReceipt: data.total_receipt || 0,
          totalSales: data.total_sales || 0,
          cashReceipt: data.cash_receipt || 0,
          cardReceipt: data.card_receipt || 0,
          payPayReceipt: data.paypay_receipt || 0,
          otherSales: data.other_sales || 0,
          notTransmittedReceipt: data.not_transmitted_receipt || 0,
          notTransmittedAmount: data.not_transmitted_amount || 0,
          unpaidAmount: data.unpaid_amount || 0,
          incomeAmount: data.income_amount || 0,
          expenseAmount: data.expense_amount || 0,
          balance: data.balance || 0,
          staffCount: data.staff_count || 0,
          castCount: data.cast_count || 0,
          remarks: data.remarks || '',
          twitterFollowers: data.twitter_followers || 0,
          instagramFollowers: data.instagram_followers || 0,
          tiktokFollowers: data.tiktok_followers || 0,
          dailyPaymentTotal: data.daily_payment_total || 0
        })
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

      const reportToSave = {
        store_id: storeId,
        business_date: dailyReportData.date,
        event_name: dailyReportData.eventName,
        weather: dailyReportData.weather,
        total_receipt: dailyReportData.totalReceipt,
        total_sales: dailyReportData.totalSales,
        cash_receipt: dailyReportData.cashReceipt,
        card_receipt: dailyReportData.cardReceipt,
        paypay_receipt: dailyReportData.payPayReceipt,
        other_sales: dailyReportData.otherSales,
        not_transmitted_receipt: dailyReportData.notTransmittedReceipt,
        not_transmitted_amount: dailyReportData.notTransmittedAmount,
        unpaid_amount: dailyReportData.unpaidAmount,
        income_amount: dailyReportData.incomeAmount,
        expense_amount: dailyReportData.expenseAmount,
        balance: dailyReportData.balance,
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
