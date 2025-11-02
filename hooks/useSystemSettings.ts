import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useSystemSettings = () => {
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5)
  const [taxRate, setTaxRate] = useState(10)
  const [serviceFeeRate, setServiceFeeRate] = useState(15)
  const [roundingType, setRoundingType] = useState('切り上げ')
  const [roundingUnit, setRoundingUnit] = useState(100)
  const [registerAmount, setRegisterAmount] = useState(50000)
  const [loading, setLoading] = useState(true)

  // すべての設定を読み込む
  const loadAllSettings = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()

      // 複数の設定を一度に取得
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('store_id', storeId)
        .in('setting_key', [
          'business_day_start_hour',
          'tax_rate',
          'service_fee_rate',
          'rounding_type',
          'rounding_unit',
          'register_amount'
        ])

      if (data) {
        data.forEach(setting => {
          switch (setting.setting_key) {
            case 'business_day_start_hour':
              setBusinessDayStartHour(Number(setting.setting_value))
              break
            case 'tax_rate':
              setTaxRate(Number(setting.setting_value))
              break
            case 'service_fee_rate':
              setServiceFeeRate(Number(setting.setting_value))
              break
            case 'rounding_type':
              setRoundingType(setting.setting_value)
              break
            case 'rounding_unit':
              setRoundingUnit(Number(setting.setting_value))
              break
            case 'register_amount':
              setRegisterAmount(Number(setting.setting_value))
              break
          }
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // 設定を保存
  const saveSettings = async () => {
    try {
      const storeId = getCurrentStoreId()

      const settings = [
        { setting_key: 'business_day_start_hour', setting_value: businessDayStartHour.toString() },
        { setting_key: 'tax_rate', setting_value: taxRate.toString() },
        { setting_key: 'service_fee_rate', setting_value: serviceFeeRate.toString() },
        { setting_key: 'rounding_type', setting_value: roundingType },
        { setting_key: 'rounding_unit', setting_value: roundingUnit.toString() },
        { setting_key: 'register_amount', setting_value: registerAmount.toString() }
      ]

      // 各設定を個別にupsert
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            ...setting,
            store_id: storeId
          }, {
            onConflict: 'setting_key,store_id'
          })

        if (error) throw error
      }

      alert('設定を保存しました')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('保存に失敗しました')
    }
  }

  return {
    // State
    businessDayStartHour,
    setBusinessDayStartHour,
    taxRate,
    setTaxRate,
    serviceFeeRate,
    setServiceFeeRate,
    roundingType,
    setRoundingType,
    roundingUnit,
    setRoundingUnit,
    registerAmount,
    setRegisterAmount,
    loading,

    // Functions
    loadAllSettings,
    saveSettings
  }
}
