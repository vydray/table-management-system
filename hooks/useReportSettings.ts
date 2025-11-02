import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useReportSettings = () => {
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5)
  const [registerAmount, setRegisterAmount] = useState(50000)
  const [activeAttendanceStatuses, setActiveAttendanceStatuses] = useState<string[]>(['出勤'])
  const [monthlyTargets, setMonthlyTargets] = useState({
    salesTarget: 12000000,
    customerTarget: 400
  })
  const [tempTargets, setTempTargets] = useState({
    salesTarget: 12000000,
    customerTarget: 400
  })
  const [showTargetSetting, setShowTargetSetting] = useState(false)

  // 営業日開始時刻を読み込み
  const loadBusinessDayStartHour = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'business_day_start_hour')
        .single()

      if (data) {
        setBusinessDayStartHour(Number(data.setting_value))
      }
    } catch (error) {
      console.error('Error loading business day start hour:', error)
    }
  }

  // レジ金を読み込み
  const loadRegisterAmount = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'register_amount')
        .single()

      if (data) {
        setRegisterAmount(Number(data.setting_value))
      }
    } catch (error) {
      console.error('Error loading register amount:', error)
    }
  }

  // 有効な勤怠ステータスを読み込み
  const loadActiveAttendanceStatuses = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'active_attendance_statuses')
        .single()

      if (data) {
        setActiveAttendanceStatuses(JSON.parse(data.setting_value))
      }
    } catch (error) {
      console.error('Error loading active attendance statuses:', error)
    }
  }

  // 月間目標を読み込み
  const loadMonthlyTargets = async (year: number, month: number) => {
    try {
      const storeId = getCurrentStoreId()
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`

      const { data } = await supabase
        .from('monthly_targets')
        .select('*')
        .eq('store_id', storeId)
        .eq('year_month', yearMonth)
        .single()

      if (data) {
        const targets = {
          salesTarget: data.sales_target || 12000000,
          customerTarget: data.customer_target || 400
        }
        setMonthlyTargets(targets)
        setTempTargets(targets)
      }
    } catch (error) {
      console.error('Error loading monthly targets:', error)
    }
  }

  // 月間目標を保存
  const saveMonthlyTargets = async (year: number, month: number) => {
    try {
      const storeId = getCurrentStoreId()
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`

      const { error } = await supabase
        .from('monthly_targets')
        .upsert({
          store_id: storeId,
          year_month: yearMonth,
          sales_target: tempTargets.salesTarget,
          customer_target: tempTargets.customerTarget
        }, {
          onConflict: 'store_id,year_month'
        })

      if (error) throw error

      setMonthlyTargets(tempTargets)
      setShowTargetSetting(false)
      alert('目標を保存しました')
    } catch (error) {
      console.error('Error saving monthly targets:', error)
      alert('保存に失敗しました')
    }
  }

  return {
    // State
    businessDayStartHour,
    registerAmount,
    activeAttendanceStatuses,
    monthlyTargets,
    tempTargets,
    setTempTargets,
    showTargetSetting,
    setShowTargetSetting,

    // Functions
    loadBusinessDayStartHour,
    loadRegisterAmount,
    loadActiveAttendanceStatuses,
    loadMonthlyTargets,
    saveMonthlyTargets
  }
}
