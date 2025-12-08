import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

interface SystemSettings {
  consumptionTaxRate: number
  serviceChargeRate: number
  roundingUnit: number
  roundingMethod: number
  cardFeeRate: number
  allowMultipleNominations: boolean
  allowMultipleCastsPerItem: boolean
}

export const useSystemConfig = () => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    consumptionTaxRate: 0.10,
    serviceChargeRate: 0.15,
    roundingUnit: 100,
    roundingMethod: 0,
    cardFeeRate: 0,
    allowMultipleNominations: false,
    allowMultipleCastsPerItem: false
  })

  const loadSystemConfig = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('store_id', storeId)

      if (settings) {
        // パーセント値（10, 20など）を小数（0.10, 0.20など）に変換
        const taxRatePercent = Number(settings.find(s => s.setting_key === 'tax_rate')?.setting_value) || 10
        const serviceFeePercent = Number(settings.find(s => s.setting_key === 'service_fee_rate')?.setting_value) || 15

        const settingsObj = {
          consumptionTaxRate: taxRatePercent / 100,  // 10% → 0.10
          serviceChargeRate: serviceFeePercent / 100,  // 20% → 0.20
          roundingUnit: Number(settings.find(s => s.setting_key === 'rounding_unit')?.setting_value) || 100,
          roundingMethod: Number(settings.find(s => s.setting_key === 'rounding_method')?.setting_value) || 0,
          cardFeeRate: Number(settings.find(s => s.setting_key === 'card_fee_rate')?.setting_value || 0) / 100,
          allowMultipleNominations: settings.find(s => s.setting_key === 'allow_multiple_nominations')?.setting_value === 'true',
          allowMultipleCastsPerItem: settings.find(s => s.setting_key === 'allow_multiple_casts_per_item')?.setting_value === 'true'
        }
        setSystemSettings(settingsObj)
      }
    } catch (error) {
      console.error('システム設定の読み込みエラー:', error)
    }
  }

  return {
    systemSettings,
    loadSystemConfig
  }
}
