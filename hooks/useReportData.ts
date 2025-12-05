import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'
import { getBusinessDayRangeDates } from '../utils/dateTime'

interface DailyData {
  date: string
  totalSales: number
  orderCount: number
  cashSales: number
  cardSales: number
  otherSales: number
  firstTimeCount: number
  returnCount: number
  regularCount: number
}

interface SalesStats {
  totalSales: number
  orderCount: number
  cashSales: number
  cardSales: number
  otherSales: number
  firstTimeCount: number
  returnCount: number
  regularCount: number
}

export const useReportData = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)

  // 営業日の範囲を取得
  const getBusinessDateRange = (dateStr: string, businessDayStartHour: number) => {
    const date = new Date(dateStr + 'T00:00:00')
    const { start, end } = getBusinessDayRangeDates(date, businessDayStartHour)

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

    return {
      start: formatDateTime(start),
      end: formatDateTime(end)
    }
  }

  // 売上統計データを取得
  const getLatestSalesData = async (dateStr: string, businessDayStartHour: number): Promise<SalesStats> => {
    try {
      const storeId = getCurrentStoreId()
      const { start, end } = getBusinessDateRange(dateStr, businessDayStartHour)

      const { data: orders } = await supabase
        .from('orders')
        .select('*, payments(*)')
        .eq('store_id', storeId)
        .is('deleted_at', null)
        .gte('checkout_datetime', start)
        .lt('checkout_datetime', end)

      if (!orders || orders.length === 0) {
        return {
          totalSales: 0,
          orderCount: 0,
          cashSales: 0,
          cardSales: 0,
          otherSales: 0,
          firstTimeCount: 0,
          returnCount: 0,
          regularCount: 0
        }
      }

      const totalSales = orders.reduce((sum, order) => sum + (order.total_incl_tax || 0), 0)
      const cashSales = orders.reduce((sum, order) => {
        const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
        return sum + (payment?.cash_amount || 0)
      }, 0)
      const cardSales = orders.reduce((sum, order) => {
        const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
        return sum + (payment?.credit_card_amount || 0)
      }, 0)
      const otherSales = orders.reduce((sum, order) => {
        const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
        return sum + (payment?.other_payment_amount || 0)
      }, 0)

      const firstTimeCount = orders.filter(order => order.visit_type === '初回').length
      const returnCount = orders.filter(order => order.visit_type === '再訪').length
      const regularCount = orders.filter(order => order.visit_type === '常連').length

      return {
        totalSales,
        orderCount: orders.length,
        cashSales,
        cardSales,
        otherSales,
        firstTimeCount,
        returnCount,
        regularCount
      }
    } catch (error) {
      console.error('Error getting latest sales data:', error)
      return {
        totalSales: 0,
        orderCount: 0,
        cashSales: 0,
        cardSales: 0,
        otherSales: 0,
        firstTimeCount: 0,
        returnCount: 0,
        regularCount: 0
      }
    }
  }

  // 勤怠データから人数・日払い集計
  const getAttendanceCountsAndPayments = async (dateStr: string, activeStatuses: string[]) => {
    try {
      const storeId = getCurrentStoreId()

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('store_id', storeId)
        .eq('date', dateStr)
        .in('status', activeStatuses)

      if (!attendanceData || attendanceData.length === 0) {
        return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }
      }

      const uniqueStaff = new Set(attendanceData.filter(a => a.role === 'staff').map(a => a.cast_name))
      const uniqueCast = new Set(attendanceData.filter(a => a.role === 'cast').map(a => a.cast_name))
      const dailyPaymentTotal = attendanceData.reduce((sum, a) => sum + (a.daily_payment || 0), 0)

      return {
        staffCount: uniqueStaff.size,
        castCount: uniqueCast.size,
        dailyPaymentTotal
      }
    } catch (error) {
      console.error('Error getting attendance counts:', error)
      return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }
    }
  }

  // 月間データを読み込み
  const loadMonthlyData = async (year: number, month: number, businessDayStartHour: number, activeStatuses: string[]) => {
    try {
      setLoading(true)
      const storeId = getCurrentStoreId()
      const daysInMonth = new Date(year, month, 0).getDate()
      const monthlyResults: DailyData[] = []

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const { start, end } = getBusinessDateRange(dateStr, businessDayStartHour)

        const { data: orders } = await supabase
          .from('orders')
          .select('*, payments(*)')
          .eq('store_id', storeId)
          .is('deleted_at', null)
          .gte('checkout_datetime', start)
          .lt('checkout_datetime', end)

        if (orders && orders.length > 0) {
          const totalSales = orders.reduce((sum, order) => sum + (order.total_incl_tax || 0), 0)
          const cashSales = orders.reduce((sum, order) => {
            const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
            return sum + (payment?.cash_amount || 0)
          }, 0)
          const cardSales = orders.reduce((sum, order) => {
            const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
            return sum + (payment?.credit_card_amount || 0)
          }, 0)
          const otherSales = orders.reduce((sum, order) => {
            const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
            return sum + (payment?.other_payment_amount || 0)
          }, 0)
          const firstTimeCount = orders.filter(order => order.visit_type === '初回').length
          const returnCount = orders.filter(order => order.visit_type === '再訪').length
          const regularCount = orders.filter(order => order.visit_type === '常連').length

          monthlyResults.push({
            date: dateStr,
            totalSales,
            orderCount: orders.length,
            cashSales,
            cardSales,
            otherSales,
            firstTimeCount,
            returnCount,
            regularCount
          })
        } else {
          monthlyResults.push({
            date: dateStr,
            totalSales: 0,
            orderCount: 0,
            cashSales: 0,
            cardSales: 0,
            otherSales: 0,
            firstTimeCount: 0,
            returnCount: 0,
            regularCount: 0
          })
        }
      }

      setDailyData(monthlyResults)
    } catch (error) {
      console.error('Error loading monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 月間合計を計算
  const calculateMonthlyTotal = (data: DailyData[]) => {
    return data.reduce((acc, day) => ({
      totalSales: acc.totalSales + day.totalSales,
      orderCount: acc.orderCount + day.orderCount,
      cashSales: acc.cashSales + day.cashSales,
      cardSales: acc.cardSales + day.cardSales,
      otherSales: acc.otherSales + day.otherSales,
      firstTimeCount: acc.firstTimeCount + day.firstTimeCount,
      returnCount: acc.returnCount + day.returnCount,
      regularCount: acc.regularCount + day.regularCount
    }), {
      totalSales: 0,
      orderCount: 0,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      firstTimeCount: 0,
      returnCount: 0,
      regularCount: 0
    })
  }

  return {
    // State
    dailyData,
    loading,

    // Functions
    loadMonthlyData,
    getLatestSalesData,
    getAttendanceCountsAndPayments,
    calculateMonthlyTotal,
    getBusinessDateRange
  }
}
