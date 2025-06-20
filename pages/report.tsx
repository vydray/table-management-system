import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'
import { DailyData, DailyReportData, MonthlyTargets } from '../types/report'
import DailyReportModal from '../components/report/DailyReportModal'
import MonthlyTargetModal from '../components/report/MonthlyTargetModal'
import SalesChart from '../components/report/SalesChart'
import MonthlySummary from '../components/report/MonthlySummary'
import DailyDataTable from '../components/report/DailyDataTable'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Report() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5)
  const [showDailyReportModal, setShowDailyReportModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTargets>({
    salesTarget: 12000000,
    customerTarget: 400
  })
  const [showTargetSetting, setShowTargetSetting] = useState(false)
  const [tempTargets, setTempTargets] = useState<MonthlyTargets>({
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
      
      if (!attendanceData || attendanceData.length === 0) {
        return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }
      }
      
      const dailyPaymentTotal = attendanceData.reduce((sum, attendance) => {
        return sum + (attendance.daily_payment || 0)
      }, 0)
      
      const castNames = attendanceData.map(a => a.cast_name)
      
      const { data: castsData } = await supabase
        .from('casts')
        .select('name, attributes')
        .eq('store_id', storeId)
        .in('name', castNames)
      
      if (!castsData) {
        return { staffCount: 0, castCount: castNames.length, dailyPaymentTotal }
      }
      
      let staffCount = 0
      let castCount = 0
      
      castsData.forEach(cast => {
        if (cast.attributes === '内勤') {
          staffCount++
        } else {
          castCount++
        }
      })
      
      return { staffCount, castCount, dailyPaymentTotal }
    } catch (error) {
      console.error('Error getting attendance counts and payments:', error)
      return { staffCount: 0, castCount: 0, dailyPaymentTotal: 0 }
    }
  }

  // 月次目標を読み込む
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
          salesTarget: data.sales_target || 12000000,
          customerTarget: data.customer_target || 400
        })
        setTempTargets({
          salesTarget: data.sales_target || 12000000,
          customerTarget: data.customer_target || 400
        })
      }
    } catch (error) {
      console.error('Error loading monthly targets:', error)
    }
  }

  // 月次目標を保存
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

  // 月次データを取得
  const loadMonthlyData = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      const monthlyData: DailyData[] = []

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

  // 日別詳細を開く
  const openDailyReport = async (day: DailyData) => {
    setSelectedDate(day.date)
    
    const { staffCount, castCount, dailyPaymentTotal } = await getAttendanceCountsAndPayments(day.date)
    
    setDailyReportData({
      date: day.date,
      eventName: '無し',
      totalReceipt: day.orderCount,
      totalSales: day.totalSales,
      cashReceipt: day.cashSales,
      cardReceipt: day.cardSales,
      payPayReceipt: 0,
      otherSales: day.otherSales,
      notTransmittedReceipt: 0,
      notTransmittedAmount: 0,
      incomeAmount: 0,
      expenseAmount: 0,
      balance: day.totalSales,
      staffCount: staffCount,
      castCount: castCount,
      remarks: '',
      twitterFollowers: 0,
      instagramFollowers: 0,
      tiktokFollowers: 0,
      dailyPaymentTotal: dailyPaymentTotal
    })
    setShowDailyReportModal(true)
  }

  // 業務日報を保存
  const saveDailyReport = async () => {
    try {
      alert('業務日報を保存しました')
      setShowDailyReportModal(false)
    } catch (error) {
      console.error('Error saving daily report:', error)
      alert('保存中にエラーが発生しました')
    }
  }

  useEffect(() => {
    loadBusinessDayStartHour()
    loadActiveAttendanceStatuses()
  }, [])

  useEffect(() => {
    loadMonthlyData()
    loadMonthlyTargets()
  }, [selectedYear, selectedMonth, businessDayStartHour])

  const monthlyTotal = dailyData.reduce((acc, cur) => ({
    totalSales: acc.totalSales + cur.totalSales,
    orderCount: acc.orderCount + cur.orderCount
  }), { totalSales: 0, orderCount: 0 })

  return (
    <>
      <Head>
        <title>📊 月次レポート - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          html, body {
            height: auto !important;
            overflow: auto !important;
            position: static !important;
            -webkit-overflow-scrolling: touch !important;
          }
          #__next {
            height: auto !important;
            overflow: auto !important;
          }
        `}</style>
      </Head>

      <div style={{
        width: '100%',
        maxWidth: '1024px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        paddingBottom: '100px',
        position: 'relative',
        height: 'auto',
        minHeight: '100vh',
        overflow: 'visible'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: '24px' }}>📊 月次レポート</h1>
          </div>

          {/* 年月選択 */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer'
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
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p>データを読み込み中...</p>
          </div>
        ) : (
          <>
            <SalesChart 
              dailyData={dailyData} 
              selectedYear={selectedYear} 
              selectedMonth={selectedMonth} 
            />
            <MonthlySummary dailyData={dailyData} />
            <DailyDataTable 
              dailyData={dailyData} 
              onRowClick={openDailyReport} 
            />
          </>
        )}

        <DailyReportModal
          show={showDailyReportModal}
          selectedDate={selectedDate}
          dailyReportData={dailyReportData}
          setDailyReportData={setDailyReportData}
          monthlyTotal={monthlyTotal}
          monthlyTargets={monthlyTargets}
          dailyData={dailyData}
          onClose={() => setShowDailyReportModal(false)}
          onSave={saveDailyReport}
          onShowTargetSetting={() => setShowTargetSetting(true)}
        />

        <MonthlyTargetModal
          show={showTargetSetting}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          tempTargets={tempTargets}
          setTempTargets={setTempTargets}
          onClose={() => setShowTargetSetting(false)}
          onSave={saveMonthlyTargets}
        />
      </div>
    </>
  )
}