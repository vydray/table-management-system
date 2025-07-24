import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'
import CashCountModal from '../components/report/CashCountModal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export default function Report() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5)
  const [showDailyReportModal, setShowDailyReportModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [monthlyTargets, setMonthlyTargets] = useState({
    salesTarget: 12000000,
    customerTarget: 400
  })
  const [showTargetSetting, setShowTargetSetting] = useState(false)
  const [tempTargets, setTempTargets] = useState({
    salesTarget: 12000000,
    customerTarget: 400
  })
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
  const [activeAttendanceStatuses, setActiveAttendanceStatuses] = useState<string[]>(['出勤'])
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 現金回収計算用の状態
  const [showCashCountModal, setShowCashCountModal] = useState(false)
  const [registerAmount, setRegisterAmount] = useState(50000) // デフォルト値
  const [calculatedCashReceipt, setCalculatedCashReceipt] = useState<number | null>(null)

  // レジ金設定を読み込む関数
  const loadRegisterAmount = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'register_amount')
        .eq('store_id', storeId)
        .single()
      
      if (data) {
        setRegisterAmount(parseInt(data.setting_value))
      }
    } catch (error) {
      console.error('Error loading register amount:', error)
    }
  }

  // 現金計算完了時の処理
  const handleCashCountComplete = (totalCash: number) => {
    setCalculatedCashReceipt(totalCash)
    setShowCashCountModal(false)
  }

  // 初期読み込み
  useEffect(() => {
    loadMonthlyData()
    loadMonthlyTargets()
    loadBusinessDayStartHour()
    loadActiveAttendanceStatuses()
    loadRegisterAmount()
  }, [selectedYear, selectedMonth])

  // 月間データを読み込む
  const loadMonthlyData = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const monthlyData: DailyData[] = []
      
      // 月の日数を取得
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      
      for (let day = 1; day <= daysInMonth; day++) {
        const targetDate = new Date(selectedYear, selectedMonth - 1, day)
        const { start, end } = getBusinessDayRange(targetDate)

        const { data: salesData } = await supabase
          .from('orders')
          .select(`
            *,
            payments(cash_amount, credit_card_amount, other_payment_amount)
          `)
          .gte('checkout_datetime', start.toISOString())
          .lt('checkout_datetime', end.toISOString())
          .eq('store_id', storeId)
          .not('checkout_datetime', 'is', null)
          .is('deleted_at', null)
          
        if (salesData && salesData.length > 0) {
          const dailyStats: DailyData = {
            date: `${selectedMonth}月${day}日`,
            totalSales: 0,
            orderCount: salesData.length,
            cashSales: 0,
            cardSales: 0,
            otherSales: 0,
            firstTimeCount: 0,
            returnCount: 0,
            regularCount: 0
          }

          salesData.forEach(sale => {
            dailyStats.totalSales += sale.total_incl_tax || 0
            
            if (sale.payments && sale.payments.length > 0) {
              const payment = sale.payments[0]
              dailyStats.cashSales += payment.cash_amount || 0
              dailyStats.cardSales += payment.credit_card_amount || 0
              dailyStats.otherSales += payment.other_payment_amount || 0
            }
            
            switch (sale.visit_type) {
              case '初回':
                dailyStats.firstTimeCount++
                break
              case '再訪':
                dailyStats.returnCount++
                break
              case '常連':
                dailyStats.regularCount++
                break
            }
          })

          monthlyData.push(dailyStats)
        } else {
          monthlyData.push({
            date: `${selectedMonth}月${day}日`,
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

      setDailyData(monthlyData)
    } catch (error) {
      console.error('Error loading monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 業務日報を読み込む関数
  const loadDailyReport = async (businessDate: string) => {
    try {
      const storeId = getCurrentStoreId()
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('store_id', storeId)
        .eq('business_date', businessDate)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily report:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error loading daily report:', error)
      return null
    }
  }

  // 日別詳細を開く（リアルタイム対応）
  const openDailyReport = async (day: DailyData) => {
    setSelectedDate(day.date)
    setCalculatedCashReceipt(null) // 現金計算結果をリセット
    
    // 常に最新の売上データを取得
    const latestSalesData = await getLatestSalesData(day.date)
    
    // 勤怠データから人数と日払いを取得
    const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(day.date)
    
    // 日付を解析して業務日を取得
    const matches = day.date.match(/(\d+)月(\d+)日/)
    if (matches) {
      const month = parseInt(matches[1])
      const dayNum = parseInt(matches[2])
      const businessDate = new Date(selectedYear, month - 1, dayNum).toISOString().slice(0, 10)
      
      // 保存されたデータ（調整項目とSNS）を読み込む
      const savedReport = await loadDailyReport(businessDate)
      
      setDailyReportData({
        date: day.date,
        eventName: savedReport?.event_name || '無し',
        weather: savedReport?.weather || '晴れ',
        // 売上関連は常に最新データを使用
        totalReceipt: latestSalesData.orderCount,
        totalSales: latestSalesData.totalSales,
        cashReceipt: latestSalesData.cashSales,
        cardReceipt: latestSalesData.cardSales,
        payPayReceipt: 0,
        otherSales: latestSalesData.otherSales,
        // 調整項目は保存されたデータを使用
        notTransmittedReceipt: savedReport?.unknown_receipt || 0,
        notTransmittedAmount: savedReport?.unknown_amount || 0,
        unpaidAmount: savedReport?.unpaid_amount || 0,
        incomeAmount: 0,
        expenseAmount: savedReport?.expense_amount || 0,
        balance: latestSalesData.totalSales,
        staffCount: staffCount,
        castCount: castCount,
        remarks: savedReport?.remarks || '',
        // SNSデータは保存されたデータを使用
        twitterFollowers: savedReport?.twitter_followers || 0,
        instagramFollowers: savedReport?.instagram_followers || 0,
        tiktokFollowers: savedReport?.tiktok_followers || 0,
        // 日払いは保存されたデータがあればそれを、なければ勤怠から
        dailyPaymentTotal: savedReport?.daily_payment_total ?? dailyPaymentTotal
      })
    }
    
    setShowDailyReportModal(true)
  }

  // 月間目標を読み込む
  const loadMonthlyTargets = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('monthly_targets')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('store_id', storeId)
        .single()
      
      if (data) {
        setMonthlyTargets({
          salesTarget: data.sales_target,
          customerTarget: data.customer_target
        })
        setTempTargets({
          salesTarget: data.sales_target,
          customerTarget: data.customer_target
        })
      }
    } catch (error) {
      console.error('Error loading monthly targets:', error)
    }
  }

  // 最新データを取得
  const updateToLatestData = async () => {
    if (!selectedDate) return
    
    setIsUpdating(true)
    try {
      const latestSalesData = await getLatestSalesData(selectedDate)
      const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(selectedDate)
      
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
      
      await loadMonthlyData()
    } catch (error) {
      console.error('Error updating data:', error)
      alert('データの更新中にエラーが発生しました')
    } finally {
      setIsUpdating(false)
    }
  }

  // 業務日報を保存
  const saveDailyReport = async () => {
    try {
      const storeId = getCurrentStoreId()
      
      // 日付を解析（"6月21日" → "2025-06-21"）
      const matches = selectedDate.match(/(\d+)月(\d+)日/)
      if (!matches) {
        alert('日付の形式が正しくありません')
        return
      }
      
      const month = parseInt(matches[1])
      const day = parseInt(matches[2])
      const businessDate = new Date(selectedYear, month - 1, day).toISOString().slice(0, 10)
      
      // 保存するデータ（売上データは保存しない）
      const reportData = {
        store_id: storeId,
        business_date: businessDate,
        event_name: dailyReportData.eventName || '無し',
        weather: dailyReportData.weather || '晴れ',
        
        // 調整項目のみ保存
        unknown_receipt: dailyReportData.notTransmittedReceipt,
        unknown_amount: dailyReportData.notTransmittedAmount,
        unpaid_amount: dailyReportData.unpaidAmount,
        expense_amount: dailyReportData.expenseAmount,
        daily_payment_total: dailyReportData.dailyPaymentTotal,
        
        // SNSフォロワー
        twitter_followers: dailyReportData.twitterFollowers,
        instagram_followers: dailyReportData.instagramFollowers,
        tiktok_followers: dailyReportData.tiktokFollowers,
        
        // その他
        remarks: dailyReportData.remarks || ''
      }
      
      // upsert（既存データがあれば更新、なければ新規作成）
      const { error } = await supabase
        .from('daily_reports')
        .upsert(reportData, {
          onConflict: 'store_id,business_date'
        })
      
      if (error) {
        console.error('Error saving daily report:', error)
        alert('保存中にエラーが発生しました: ' + error.message)
        return
      }
      
      alert('業務日報を保存しました')
      setShowDailyReportModal(false)
    } catch (error) {
      console.error('Error saving daily report:', error)
      alert('保存中にエラーが発生しました')
    }
  }

  // 月間目標を保存
  const saveMonthlyTargets = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('monthly_targets')
        .upsert({
          year: selectedYear,
          month: selectedMonth,
          sales_target: tempTargets.salesTarget,
          customer_target: tempTargets.customerTarget,
          store_id: storeId
        }, {
          onConflict: 'year,month,store_id'
        })
      
      if (!error) {
        setMonthlyTargets(tempTargets)
        setShowTargetSetting(false)
        alert('目標を保存しました')
      }
    } catch (error) {
      console.error('Error saving monthly targets:', error)
      alert('保存中にエラーが発生しました')
    }
  }

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
        setBusinessDayStartHour(data.setting_value)
      }
    } catch (error) {
      console.error('Error loading business day start hour:', error)
    }
  }

  // 営業日の開始・終了時刻を計算
  const getBusinessDayRange = (date: Date) => {
    const start = new Date(date)
    start.setHours(businessDayStartHour, 0, 0, 0)
    
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    end.setHours(businessDayStartHour, 0, 0, 0)
    
    return { start, end }
  }

  // 最新の売上データを取得する関数
  const getLatestSalesData = async (dateStr: string): Promise<SalesStats> => {
    try {
      const storeId = getCurrentStoreId()
      const matches = dateStr.match(/(\d+)月(\d+)日/)
      if (!matches) return { totalSales: 0, orderCount: 0, cashSales: 0, cardSales: 0, otherSales: 0, firstTimeCount: 0, returnCount: 0, regularCount: 0 }
      
      const month = parseInt(matches[1])
      const day = parseInt(matches[2])
      const targetDate = new Date(selectedYear, month - 1, day)
      const { start, end } = getBusinessDayRange(targetDate)

      const { data: salesData } = await supabase
        .from('orders')
        .select(`
          *,
          payments(cash_amount, credit_card_amount, other_payment_amount)
        `)
        .gte('checkout_datetime', start.toISOString())
        .lt('checkout_datetime', end.toISOString())
        .eq('store_id', storeId)
        .not('checkout_datetime', 'is', null)
        .is('deleted_at', null)

      const stats: SalesStats = {
        totalSales: 0,
        orderCount: salesData?.length || 0,
        cashSales: 0,
        cardSales: 0,
        otherSales: 0,
        firstTimeCount: 0,
        returnCount: 0,
        regularCount: 0
      }

      if (salesData && salesData.length > 0) {
        salesData.forEach(sale => {
          stats.totalSales += sale.total_incl_tax || 0
          
          if (sale.payments && sale.payments.length > 0) {
            const payment = sale.payments[0]
            stats.cashSales += payment.cash_amount || 0
            stats.cardSales += payment.credit_card_amount || 0
            stats.otherSales += payment.other_payment_amount || 0
          }
          
          switch (sale.visit_type) {
            case '初回':
              stats.firstTimeCount++
              break
            case '再訪':
              stats.returnCount++
              break
            case '常連':
              stats.regularCount++
              break
          }
        })
      }

      return stats
    } catch (error) {
      console.error('Error getting latest sales data:', error)
      return { totalSales: 0, orderCount: 0, cashSales: 0, cardSales: 0, otherSales: 0, firstTimeCount: 0, returnCount: 0, regularCount: 0 }
    }
  }

  // 現金回収を計算する関数
  const calculateCashReceipt = () => {
    return dailyReportData.cashReceipt - 
           dailyReportData.notTransmittedReceipt - 
           dailyReportData.notTransmittedAmount - 
           dailyReportData.unpaidAmount - 
           dailyReportData.expenseAmount - 
           dailyReportData.dailyPaymentTotal
  }

  // 出勤として扱うステータスを取得
  const loadActiveAttendanceStatuses = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'active_attendance_statuses')
        .eq('store_id', storeId)
        .single()
      
      if (data && data.setting_value) {
        const statuses = JSON.parse(data.setting_value)
        setActiveAttendanceStatuses(statuses)
      }
    } catch (error) {
      console.error('Error loading active attendance statuses:', error)
      setActiveAttendanceStatuses(['出勤'])
    }
  }

  // 営業日の日付範囲を計算（営業日切り替え時間を考慮）
  const getBusinessDateRange = (dateStr: string) => {
    const matches = dateStr.match(/(\d+)月(\d+)日/)
    if (!matches) return { startDate: '', endDate: '' }
    
    const month = parseInt(matches[1])
    const day = parseInt(matches[2])
    
    const startDate = new Date(selectedYear, month - 1, day, businessDayStartHour, 0, 0)
    const endDate = new Date(selectedYear, month - 1, day + 1, businessDayStartHour, 0, 0)
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  // 勤怠データから内勤・キャストの人数と日払い合計を取得
  const getAttendanceCountsAndPayments = async (dateStr: string) => {
    try {
      const storeId = getCurrentStoreId()
      
      const { startDate, endDate } = getBusinessDateRange(dateStr)
      if (!startDate || !endDate) return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }
      
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('cast_name, status, daily_payment, check_in_datetime')
        .eq('store_id', storeId)
        .gte('check_in_datetime', startDate)
        .lt('check_in_datetime', endDate)
        .in('status', activeAttendanceStatuses)

      if (!attendanceData) return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }

      // キャスト情報を取得して内勤/キャストを判別
      const { data: castsData } = await supabase
        .from('casts')
        .select('name, employment_type')
        .eq('store_id', storeId)

      const castMap = new Map()
      castsData?.forEach(cast => {
        castMap.set(cast.name, cast.employment_type)
      })

      let staffCount = 0
      let castCount = 0
      let dailyPaymentTotal = 0

      attendanceData.forEach(attendance => {
        const employmentType = castMap.get(attendance.cast_name)
        if (employmentType === '内勤') {
          staffCount++
        } else {
          castCount++
        }
        dailyPaymentTotal += attendance.daily_payment || 0
      })

      return { staffCount, castCount, dailyPaymentTotal }
    } catch (error) {
      console.error('Error getting attendance counts:', error)
      return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }
    }
  }

  // 月間合計を計算
  const monthlyTotal = dailyData.reduce((acc, day) => ({
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

  return (
    <>
      <Head>
        <title>レポート - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', overflow: 'auto' }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>📊 レポート</h1>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ホームに戻る
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          {/* 年月選択 */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>

              <button
                onClick={() => setShowTargetSetting(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto'
                }}
              >
                月間目標設定
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>読み込み中...</div>
            </div>
          ) : (
            <>
              {/* サマリー */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>月間売上</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>
                    ¥{monthlyTotal.totalSales.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    目標達成率: {((monthlyTotal.totalSales / monthlyTargets.salesTarget) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>月間客数</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {monthlyTotal.orderCount}人
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    目標達成率: {((monthlyTotal.orderCount / monthlyTargets.customerTarget) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>平均単価</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9800' }}>
                    ¥{monthlyTotal.orderCount > 0 ? Math.floor(monthlyTotal.totalSales / monthlyTotal.orderCount).toLocaleString() : 0}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>営業日数</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9C27B0' }}>
                    {dailyData.filter(d => d.orderCount > 0).length}日
                  </div>
                </div>
              </div>

              {/* 日別データテーブル */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflowX: 'auto'
              }}>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>日別データ</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', minWidth: '80px' }}>日付</th>
                      <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>総売上</th>
                      <th style={{ padding: '10px', textAlign: 'right', minWidth: '60px' }}>会計数</th>
                      <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>現金売上</th>
                      <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>カード売上</th>
                      <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>その他</th>
                      <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>初回</th>
                      <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>再訪</th>
                      <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>常連</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((day, index) => (
                      <tr 
                        key={index} 
                        style={{ 
                          borderBottom: '1px solid #eee',
                          backgroundColor: day.orderCount === 0 ? '#f9f9f9' : 'white',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => openDailyReport(day)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = day.orderCount === 0 ? '#f9f9f9' : 'white'}
                      >
                        <td style={{ padding: '10px' }}>{day.date}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          ¥{day.totalSales.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          {day.orderCount}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          ¥{day.cashSales.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          ¥{day.cardSales.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          ¥{day.otherSales.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {day.firstTimeCount > 0 ? day.firstTimeCount : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {day.returnCount > 0 ? day.returnCount : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {day.regularCount > 0 ? day.regularCount : '-'}
                        </td>
                      </tr>
                    ))}
                    {/* 合計行 */}
                    <tr style={{ 
                      borderTop: '2px solid #333',
                      backgroundColor: '#f0f0f0',
                      fontWeight: 'bold'
                    }}>
                      <td style={{ padding: '10px' }}>合計</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        ¥{monthlyTotal.totalSales.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {monthlyTotal.orderCount}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        ¥{monthlyTotal.cashSales.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        ¥{monthlyTotal.cardSales.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        ¥{monthlyTotal.otherSales.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {monthlyTotal.firstTimeCount}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {monthlyTotal.returnCount}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {monthlyTotal.regularCount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* 業務日報モーダル */}
        {showDailyReportModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}>
              {/* モーダルヘッダー */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                zIndex: 1
              }}>
                <button
                  onClick={() => setShowDailyReportModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#666'
                  }}
                >
                  ←
                </button>
                <h2 style={{ margin: 0, fontSize: '20px', flex: 1, textAlign: 'center' }}>
                  業務日報 - {selectedDate}
                </h2>
                <button
                  onClick={updateToLatestData}
                  disabled={isUpdating}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isUpdating ? '#e0e0e0' : '#fff',
                    color: isUpdating ? '#999' : '#2196F3',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  {isUpdating ? '更新中...' : '🔄 最新データを取得'}
                </button>
              </div>

              {/* モーダルコンテンツ */}
              <div style={{ padding: '20px' }}>
                {/* 左側と右側のコンテナ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* 左側：売上情報 */}
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <tbody>
                        <tr>
                          <td style={{ backgroundColor: '#ffcccc', padding: '12px', textAlign: 'center', border: '1px solid #999', width: '50%', fontSize: '16px' }}>
                            <button
                              onClick={() => setShowCashCountModal(true)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'center',
                                fontSize: '16px',
                                padding: 0,
                                color: '#0066cc',
                                textDecoration: 'underline'
                              }}
                            >
                              現金回収
                            </button>
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '12px', textAlign: 'right', border: '1px solid #999', fontWeight: 'bold', fontSize: '16px' }}>
                            ¥{(calculatedCashReceipt !== null ? calculatedCashReceipt : calculateCashReceipt()).toLocaleString()}-
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#ffffcc', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            総売上
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '12px', textAlign: 'right', border: '1px solid #999', fontWeight: 'bold', fontSize: '16px' }}>
                            ¥{dailyReportData.totalSales.toLocaleString()}-
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#cce5ff', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            現金払い
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '12px', textAlign: 'right', border: '1px solid #999', fontWeight: 'bold', fontSize: '16px' }}>
                            ¥{dailyReportData.cashReceipt.toLocaleString()}-
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#cce5ff', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            カード
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '12px', textAlign: 'right', border: '1px solid #999', fontWeight: 'bold', fontSize: '16px' }}>
                            ¥{dailyReportData.cardReceipt.toLocaleString()}-
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#cce5ff', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            その他
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '12px', textAlign: 'right', border: '1px solid #999', fontWeight: 'bold', fontSize: '16px' }}>
                            ¥{dailyReportData.otherSales.toLocaleString()}-
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* 調整項目 */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <tbody>
                        <tr>
                          <td style={{ backgroundColor: '#f0f0f0', padding: '12px', textAlign: 'center', border: '1px solid #999', width: '50%', fontSize: '16px' }}>
                            未送伝票数
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '8px', textAlign: 'right', border: '1px solid #999' }}>
                            <input
                              type="number"
                              value={dailyReportData.notTransmittedReceipt}
                              onChange={(e) => setDailyReportData({...dailyReportData, notTransmittedReceipt: Number(e.target.value)})}
                              style={{
                                width: '100%',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'right',
                                fontSize: '16px'
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f0f0f0', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            未送伝票額
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '8px', textAlign: 'right', border: '1px solid #999' }}>
                            <input
                              type="number"
                              value={dailyReportData.notTransmittedAmount}
                              onChange={(e) => setDailyReportData({...dailyReportData, notTransmittedAmount: Number(e.target.value)})}
                              style={{
                                width: '100%',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'right',
                                fontSize: '16px'
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f0f0f0', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            未収金
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '8px', textAlign: 'right', border: '1px solid #999' }}>
                            <input
                              type="number"
                              value={dailyReportData.unpaidAmount}
                              onChange={(e) => setDailyReportData({...dailyReportData, unpaidAmount: Number(e.target.value)})}
                              style={{
                                width: '100%',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'right',
                                fontSize: '16px'
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f0f0f0', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            経費
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '8px', textAlign: 'right', border: '1px solid #999' }}>
                            <input
                              type="number"
                              value={dailyReportData.expenseAmount}
                              onChange={(e) => setDailyReportData({...dailyReportData, expenseAmount: Number(e.target.value)})}
                              style={{
                                width: '100%',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'right',
                                fontSize: '16px'
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f0f0f0', padding: '12px', textAlign: 'center', border: '1px solid #999', fontSize: '16px' }}>
                            日払い
                          </td>
                          <td style={{ backgroundColor: '#fff', padding: '8px', textAlign: 'right', border: '1px solid #999' }}>
                            <input
                              type="number"
                              value={dailyReportData.dailyPaymentTotal}
                              onChange={(e) => setDailyReportData({...dailyReportData, dailyPaymentTotal: Number(e.target.value)})}
                              style={{
                                width: '100%',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'right',
                                fontSize: '16px'
                              }}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 右側：月間情報と人数 */}
                  <div>
                    {/* 月間売上・達成率 */}
                    <div style={{ marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div>
                        <div style={{ backgroundColor: '#ffcccc', padding: '10px', border: '1px solid #999', borderBottom: 'none' }}>
                          <div style={{ fontSize: '14px', textAlign: 'center' }}>月間総売上</div>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #999', textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>¥{monthlyTotal.totalSales.toLocaleString()}-</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ backgroundColor: '#ffcccc', padding: '10px', border: '1px solid #999', borderBottom: 'none' }}>
                          <div style={{ fontSize: '14px', textAlign: 'center' }}>達成率</div>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #999', textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{((monthlyTotal.totalSales / monthlyTargets.salesTarget) * 100).toFixed(2)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* 客数・月間達成率 */}
                    <div style={{ marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                        <div>
                          <div style={{ backgroundColor: '#e8e8ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none', borderTopLeftRadius: '6px' }}>
                            客数
                          </div>
                          <div style={{ backgroundColor: '#fff', padding: '15px', textAlign: 'center', border: '1px solid #999', fontWeight: 'bold', fontSize: '20px' }}>
                            {dailyReportData.totalReceipt}
                          </div>
                        </div>
                        <div>
                          <div style={{ backgroundColor: '#e8e8ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none', borderLeft: 'none', borderTopRightRadius: '6px' }}>
                            客数単価
                          </div>
                          <div style={{ backgroundColor: '#fff', padding: '15px', textAlign: 'center', border: '1px solid #999', borderLeft: 'none', fontWeight: 'bold', fontSize: '20px' }}>
                            {dailyReportData.totalReceipt > 0 ? `¥${Math.floor(dailyReportData.totalSales / dailyReportData.totalReceipt).toLocaleString()}` : '-'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                        <div>
                          <div style={{ backgroundColor: '#e8e8ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none', borderBottomLeftRadius: '6px' }}>
                            月間客数
                          </div>
                          <div style={{ backgroundColor: '#fff', padding: '10px', textAlign: 'center', border: '1px solid #999', fontSize: '14px' }}>
                            {monthlyTotal.orderCount}人
                          </div>
                        </div>
                        <div>
                          <div style={{ backgroundColor: '#e8e8ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none', borderLeft: 'none', borderBottomRightRadius: '6px' }}>
                            達成率
                          </div>
                          <div style={{ backgroundColor: '#fff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderLeft: 'none', fontSize: '14px' }}>
                            {((monthlyTotal.orderCount / monthlyTargets.customerTarget) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 人数 */}
                    <div style={{ marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                        <div>
                          <div style={{ backgroundColor: '#ffcccc', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none', borderTopLeftRadius: '6px' }}>
                            内勤
                          </div>
                          <div style={{ backgroundColor: '#fff', padding: '15px', textAlign: 'center', border: '1px solid #999', fontWeight: 'bold', fontSize: '20px' }}>
                            {dailyReportData.staffCount}人
                          </div>
                        </div>
                        <div>
                          <div style={{ backgroundColor: '#ffcccc', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none', borderLeft: 'none', borderTopRightRadius: '6px' }}>
                            キャスト
                          </div>
                          <div style={{ backgroundColor: '#fff', padding: '15px', textAlign: 'center', border: '1px solid #999', borderLeft: 'none', fontWeight: 'bold', fontSize: '20px' }}>
                            {dailyReportData.castCount}人
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 天候とイベント */}
                    <div style={{ marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div>
                        <div style={{ backgroundColor: '#cce5ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none' }}>
                          天候
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '8px', border: '1px solid #999' }}>
                          <select
                            value={dailyReportData.weather || '晴れ'}
                            onChange={(e) => setDailyReportData({...dailyReportData, weather: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '4px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '16px'
                            }}
                          >
                            <option value="晴れ">晴れ</option>
                            <option value="曇り">曇り</option>
                            <option value="雨">雨</option>
                            <option value="雪">雪</option>
                            <option value="台風">台風</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div style={{ backgroundColor: '#cce5ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none' }}>
                          イベント
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '8px', border: '1px solid #999' }}>
                          <input
                            type="text"
                            value={dailyReportData.eventName}
                            onChange={(e) => setDailyReportData({...dailyReportData, eventName: e.target.value})}
                            placeholder="無し"
                            style={{
                              width: '100%',
                              padding: '4px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '16px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SNSフォロワー数 */}
                    <div style={{ marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div style={{ backgroundColor: '#e8e8ff', padding: '10px', textAlign: 'center', border: '1px solid #999', borderBottom: 'none' }}>
                        SNSフォロワー数
                      </div>
                      <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #999' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
                          <label style={{ fontSize: '14px' }}>Twitter</label>
                          <input
                            type="number"
                            value={dailyReportData.twitterFollowers}
                            onChange={(e) => setDailyReportData({...dailyReportData, twitterFollowers: Number(e.target.value)})}
                            style={{
                              padding: '4px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'right'
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                          <label style={{ fontSize: '14px' }}>Instagram</label>
                          <input
                            type="number"
                            value={dailyReportData.instagramFollowers}
                            onChange={(e) => setDailyReportData({...dailyReportData, instagramFollowers: Number(e.target.value)})}
                            style={{
                              padding: '4px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'right'
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                          <label style={{ fontSize: '14px' }}>TikTok</label>
                          <input
                            type="number"
                            value={dailyReportData.tiktokFollowers}
                            onChange={(e) => setDailyReportData({...dailyReportData, tiktokFollowers: Number(e.target.value)})}
                            style={{
                              padding: '4px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'right'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 備考欄 */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ backgroundColor: '#f0f0f0', padding: '10px', border: '1px solid #999', borderBottom: 'none' }}>
                    備考
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #999' }}>
                    <textarea
                      value={dailyReportData.remarks}
                      onChange={(e) => setDailyReportData({...dailyReportData, remarks: e.target.value})}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="特記事項があれば入力してください"
                    />
                  </div>
                </div>

                {/* ボタン */}
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <button
                    onClick={() => setShowDailyReportModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    閉じる
                  </button>
                  <button
                    onClick={saveDailyReport}
                    style={{
                      padding: '10px 30px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 月間目標設定モーダル */}
        {showTargetSetting && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '30px',
              minWidth: '400px'
            }}>
              <h3 style={{ margin: '0 0 20px 0' }}>月間目標設定</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold'
                }}>
                  売上目標
                </label>
                <input
                  type="number"
                  value={tempTargets.salesTarget}
                  onChange={(e) => setTempTargets({...tempTargets, salesTarget: Number(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold'
                }}>
                  客数目標
                </label>
                <input
                  type="number"
                  value={tempTargets.customerTarget}
                  onChange={(e) => setTempTargets({...tempTargets, customerTarget: Number(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '30px'
              }}>
                <button
                  onClick={() => setShowTargetSetting(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={saveMonthlyTargets}
                  style={{
                    padding: '10px 30px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 現金回収計算モーダル */}
        <CashCountModal
          isOpen={showCashCountModal}
          onClose={() => setShowCashCountModal(false)}
          cashReceipt={dailyReportData.cashReceipt}
          registerAmount={registerAmount}
          businessDate={(() => {
            const matches = selectedDate.match(/(\d+)月(\d+)日/)
            if (matches) {
              const month = parseInt(matches[1])
              const day = parseInt(matches[2])
              return new Date(selectedYear, month - 1, day).toISOString().slice(0, 10)
            }
            return ''
          })()}
          onComplete={handleCashCountComplete}
        />
      </div>
    </>
  )
}