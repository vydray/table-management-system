import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

interface SystemSettings {
  consumptionTaxRate: number
  serviceChargeRate: number
  roundingUnit: number
  roundingMethod: number
  cardFeeRate: number
}

export const useSystemConfig = () => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    consumptionTaxRate: 0.10,
    serviceChargeRate: 0.15,
    roundingUnit: 100,
    roundingMethod: 0,
    cardFeeRate: 0
  })

  const loadSystemConfig = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('store_id', storeId)

      if (settings) {
        const settingsObj = {
          consumptionTaxRate: settings.find(s => s.setting_key === 'consumption_tax_rate')?.setting_value || 0.10,
          serviceChargeRate: settings.find(s => s.setting_key === 'service_charge_rate')?.setting_value || 0.15,
          roundingUnit: settings.find(s => s.setting_key === 'rounding_unit')?.setting_value || 100,
          roundingMethod: settings.find(s => s.setting_key === 'rounding_method')?.setting_value || 0,
          cardFeeRate: Number(settings.find(s => s.setting_key === 'card_fee_rate')?.setting_value || 0) / 100
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
