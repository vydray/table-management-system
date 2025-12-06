import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

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
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // 全ての設定を一括で読み込み
  const loadAllSettings = async () => {
    try {
      const storeId = getCurrentStoreId()

      // 並列で全ての設定を読み込み
      const [businessDayResult, registerResult, statusesResult] = await Promise.all([
        supabase
          .from('system_settings')
          .select('setting_value')
          .eq('store_id', storeId)
          .eq('setting_key', 'business_day_start_hour')
          .maybeSingle(),
        supabase
          .from('system_settings')
          .select('setting_value')
          .eq('store_id', storeId)
          .eq('setting_key', 'register_amount')
          .maybeSingle(),
        supabase
          .from('attendance_statuses')
          .select('name')
          .eq('store_id', storeId)
          .eq('is_active', true)
      ])

      if (businessDayResult.data) {
        setBusinessDayStartHour(Number(businessDayResult.data.setting_value))
      }
      if (registerResult.data) {
        setRegisterAmount(Number(registerResult.data.setting_value))
      }
      if (statusesResult.data && statusesResult.data.length > 0) {
        setActiveAttendanceStatuses(statusesResult.data.map(s => s.name))
      }

      setSettingsLoaded(true)
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettingsLoaded(true) // エラーでもフラグは立てる（デフォルト値で進む）
    }
  }

  // 営業日開始時刻を読み込み（個別読み込み用）
  const loadBusinessDayStartHour = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'business_day_start_hour')
        .maybeSingle()

      if (!error && data) {
        setBusinessDayStartHour(Number(data.setting_value))
      }
    } catch {
      // エラー時はデフォルト値を使用
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
        .maybeSingle()

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
        .from('attendance_statuses')
        .select('name')
        .eq('store_id', storeId)
        .eq('is_active', true)

      if (data && data.length > 0) {
        setActiveAttendanceStatuses(data.map(s => s.name))
      }
    } catch (error) {
      console.error('Error loading active attendance statuses:', error)
    }
  }

  // 月間目標を読み込み
  const loadMonthlyTargets = async (year: number, month: number) => {
    try {
      const storeId = getCurrentStoreId()

      const { data } = await supabase
        .from('monthly_targets')
        .select('*')
        .eq('store_id', storeId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle()

      if (data) {
        const targets = {
          salesTarget: data.sales_target || 12000000,
          customerTarget: data.customer_target || 400
        }
        setMonthlyTargets(targets)
        setTempTargets(targets)
      } else {
        // データがない場合はデフォルト値をセット
        const defaultTargets = {
          salesTarget: 12000000,
          customerTarget: 400
        }
        setMonthlyTargets(defaultTargets)
        setTempTargets(defaultTargets)
      }
    } catch (error) {
      console.error('Error loading monthly targets:', error)
    }
  }

  // 月間目標を保存
  const saveMonthlyTargets = async (year: number, month: number) => {
    try {
      const storeId = getCurrentStoreId()

      const { error } = await supabase
        .from('monthly_targets')
        .upsert({
          store_id: storeId,
          year: year,
          month: month,
          sales_target: tempTargets.salesTarget,
          customer_target: tempTargets.customerTarget
        }, {
          onConflict: 'store_id,year,month'
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
    settingsLoaded,

    // Functions
    loadAllSettings,
    loadBusinessDayStartHour,
    loadRegisterAmount,
    loadActiveAttendanceStatuses,
    loadMonthlyTargets,
    saveMonthlyTargets
  }
}
