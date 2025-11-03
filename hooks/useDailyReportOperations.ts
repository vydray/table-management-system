import { useState } from 'react'
import { DailyReportData } from './useDailyReport'

interface DayData {
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

export const useDailyReportOperations = (
  selectedYear: number,
  selectedMonth: number,
  selectedDate: string,
  businessDayStartHour: number,
  activeAttendanceStatuses: string[],
  getLatestSalesData: (date: string, startHour: number) => Promise<any>,
  getAttendanceCountsAndPayments: (date: string, statuses: string[]) => Promise<any>,
  loadDailyReport: (businessDate: string) => Promise<void>,
  setDailyReportData: React.Dispatch<React.SetStateAction<DailyReportData>>,
  setSelectedDate: (date: string) => void,
  setShowDailyReportModal: (show: boolean) => void,
  loadMonthlyData: (year: number, month: number, startHour: number, statuses: string[]) => Promise<void>
) => {
  const [calculatedCashReceipt, setCalculatedCashReceipt] = useState<number | null>(null)
  const [showCashCountModal, setShowCashCountModal] = useState(false)

  // 現金回収を計算する関数
  const calculateCashReceipt = (dailyReportData: DailyReportData) => {
    return dailyReportData.cashReceipt -
           dailyReportData.notTransmittedReceipt -
           dailyReportData.notTransmittedAmount -
           dailyReportData.unpaidAmount -
           dailyReportData.expenseAmount -
           dailyReportData.dailyPaymentTotal
  }

  // 現金計算完了時の処理
  const handleCashCountComplete = (totalCash: number) => {
    setCalculatedCashReceipt(totalCash)
    setShowCashCountModal(false)
  }

  // 日別詳細を開く（リアルタイム対応）
  const openDailyReport = async (day: DayData) => {
    setSelectedDate(day.date)
    setCalculatedCashReceipt(null) // 現金計算結果をリセット

    // 常に最新の売上データを取得
    const latestSalesData = await getLatestSalesData(day.date, businessDayStartHour)

    // 勤怠データから人数と日払いを取得
    const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(day.date, activeAttendanceStatuses)

    // 日付を解析して業務日を取得
    const matches = day.date.match(/(\d+)月(\d+)日/)
    if (matches) {
      const month = parseInt(matches[1])
      const dayNum = parseInt(matches[2])
      const businessDate = new Date(selectedYear, month - 1, dayNum).toISOString().slice(0, 10)

      // 保存されたデータ（調整項目とSNS）を読み込む
      await loadDailyReport(businessDate)

      // loadDailyReportで読み込まれたデータに最新の売上データを上書き
      setDailyReportData(prev => ({
        ...prev,
        date: day.date,
        totalReceipt: latestSalesData.orderCount,
        totalSales: latestSalesData.totalSales,
        cashReceipt: latestSalesData.cashSales,
        cardReceipt: latestSalesData.cardSales,
        payPayReceipt: 0,
        otherSales: latestSalesData.otherSales,
        balance: latestSalesData.totalSales,
        staffCount: staffCount,
        castCount: castCount,
        dailyPaymentTotal: prev.dailyPaymentTotal || dailyPaymentTotal
      }))
    }

    setShowDailyReportModal(true)
  }

  // 最新データを取得
  const updateToLatestData = async () => {
    if (!selectedDate) return

    try {
      const latestSalesData = await getLatestSalesData(selectedDate, businessDayStartHour)
      const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(selectedDate, activeAttendanceStatuses)

      setDailyReportData(prev => ({
        ...prev,
        totalReceipt: latestSalesData.orderCount,
        totalSales: latestSalesData.totalSales,
        cashReceipt: latestSalesData.cashSales,
        cardReceipt: latestSalesData.cardSales,
        otherSales: latestSalesData.otherSales,
        balance: latestSalesData.totalSales,
        staffCount: staffCount,
        castCount: castCount,
        dailyPaymentTotal: prev.dailyPaymentTotal > 0 ? prev.dailyPaymentTotal : dailyPaymentTotal
      }))

      await loadMonthlyData(selectedYear, selectedMonth, businessDayStartHour, activeAttendanceStatuses)
    } catch (error) {
      console.error('Error updating data:', error)
      alert('データの更新中にエラーが発生しました')
    }
  }

  return {
    calculatedCashReceipt,
    showCashCountModal,
    setShowCashCountModal,
    calculateCashReceipt,
    handleCashCountComplete,
    openDailyReport,
    updateToLatestData
  }
}
