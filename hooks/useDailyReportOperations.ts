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
    // day.dateはISO形式（"2025-11-04"）で渡される
    const businessDate = day.date

    console.log('[openDailyReport] day.date:', day.date)
    console.log('[openDailyReport] businessDayStartHour:', businessDayStartHour)

    // 表示用の日付を作成（"11月4日"形式）
    const dateObj = new Date(businessDate + 'T00:00:00')
    const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`

    console.log('[openDailyReport] displayDate:', displayDate)

    setSelectedDate(displayDate)
    setCalculatedCashReceipt(null) // 現金計算結果をリセット

    // 常に最新の売上データを取得（businessDate形式で渡す）
    const latestSalesData = await getLatestSalesData(businessDate, businessDayStartHour)

    console.log('[openDailyReport] latestSalesData:', latestSalesData)

    // 勤怠データから人数と日払いを取得（businessDate形式で渡す）
    const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(businessDate, activeAttendanceStatuses)

    // 先に最新の売上データを設定（日付はISO形式でデータベース用に保持）
    setDailyReportData(prev => ({
      ...prev,
      date: businessDate,  // ISO形式で保存（データベース保存用）
      totalReceipt: latestSalesData.orderCount,
      totalSales: latestSalesData.totalSales,
      cashReceipt: latestSalesData.cashSales,
      cardReceipt: latestSalesData.cardSales,
      payPayReceipt: 0,
      otherSales: latestSalesData.otherSales,
      balance: latestSalesData.totalSales,
      staffCount: staffCount,
      castCount: castCount,
      dailyPaymentTotal: dailyPaymentTotal
    }))

    // その後、保存されたデータ（調整項目とSNS）を読み込んで追加
    console.log('[openDailyReport] Calling loadDailyReport with businessDate:', businessDate)
    await loadDailyReport(businessDate)

    setShowDailyReportModal(true)
  }

  // 最新データを取得
  const updateToLatestData = async () => {
    if (!selectedDate) return

    try {
      // dailyReportDataから業務日を取得（ISO形式で保存されている）
      const businessDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 7)
      // selectedDateから日付を解析
      const matches = selectedDate.match(/(\d+)月(\d+)日/)
      if (!matches) return

      const month = parseInt(matches[1])
      const dayNum = parseInt(matches[2])
      const businessDateStr = `${selectedYear}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

      const latestSalesData = await getLatestSalesData(businessDateStr, businessDayStartHour)
      const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(businessDateStr, activeAttendanceStatuses)

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
