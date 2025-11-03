import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useSystemSettings = () => {
  const [businessDayStartHour, setBusinessDayStartHour] = useState(18)
  const [taxRate, setTaxRate] = useState(10)
  const [serviceFeeRate, setServiceFeeRate] = useState(15)
  const [roundingType, setRoundingType] = useState('四捨五入')
  const [roundingUnit, setRoundingUnit] = useState(100)
  const [registerAmount, setRegisterAmount] = useState(0)
  const [cardFeeRate, setCardFeeRate] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 全設定を読み込み
  const loadAllSettings = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()

      // 営業日開始時刻を取得
      const { data: businessDayData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'business_day_start_hour')
        .single()

      if (businessDayData) {
        setBusinessDayStartHour(Number(businessDayData.setting_value))
      }

      // 消費税率を取得
      const { data: taxData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'tax_rate')
        .single()

      if (taxData) {
        setTaxRate(Number(taxData.setting_value))
      }

      // サービス料率を取得
      const { data: serviceFeeData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'service_fee_rate')
        .single()

      if (serviceFeeData) {
        setServiceFeeRate(Number(serviceFeeData.setting_value))
      }

      // 端数処理を取得（rounding_methodとして数値で保存されている）
      const { data: roundingMethodData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'rounding_method')
        .single()

      if (roundingMethodData) {
        const method = Number(roundingMethodData.setting_value)
        // 数値から文字列に変換: 0=切り上げ, 1=切り捨て, 2=四捨五入
        const typeMap = ['切り上げ', '切り捨て', '四捨五入']
        setRoundingType(typeMap[method] || '四捨五入')
      }

      // 端数単位を取得
      const { data: roundingUnitData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'rounding_unit')
        .single()

      if (roundingUnitData) {
        setRoundingUnit(Number(roundingUnitData.setting_value))
      }

      // レジ金を取得
      const { data: registerData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'register_amount')
        .single()

      if (registerData) {
        setRegisterAmount(Number(registerData.setting_value))
      }

      // カード手数料率を取得
      const { data: cardFeeData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('store_id', storeId)
        .eq('setting_key', 'card_fee_rate')
        .single()

      if (cardFeeData) {
        setCardFeeRate(Number(cardFeeData.setting_value))
      }
    } catch (error) {
      console.error('Error loading system settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // 全設定を保存
  const saveSettings = async () => {
    // 連打防止
    if (saving) {
      console.log('Already saving, skipping...')
      return
    }

    setSaving(true)
    try {
      const storeId = getCurrentStoreId()

      // 店舗IDのチェック
      if (!storeId || storeId === 0) {
        console.error('Store ID not found')
        alert('店舗情報が取得できません。再ログインしてください。')
        return
      }

      console.log('Saving settings for store:', storeId)

      // 端数処理の文字列を数値に変換: 切り上げ=0, 切り捨て=1, 四捨五入=2
      const roundingMethodMap: { [key: string]: number } = {
        '切り上げ': 0,
        '切り捨て': 1,
        '四捨五入': 2
      }
      const roundingMethodValue = roundingMethodMap[roundingType] ?? 2

      const settingsToSave = [
        { setting_key: 'business_day_start_hour', setting_value: String(businessDayStartHour) },
        { setting_key: 'tax_rate', setting_value: String(taxRate) },
        { setting_key: 'service_fee_rate', setting_value: String(serviceFeeRate) },
        { setting_key: 'rounding_method', setting_value: String(roundingMethodValue) },
        { setting_key: 'rounding_unit', setting_value: String(roundingUnit) },
        { setting_key: 'register_amount', setting_value: String(registerAmount) },
        { setting_key: 'card_fee_rate', setting_value: String(cardFeeRate) }
      ]

      for (const setting of settingsToSave) {
        console.log('Saving setting:', setting.setting_key, '=', setting.setting_value)

        try {
          // 既存のレコードを確認
          const { data: existing } = await supabase
            .from('system_settings')
            .select('id')
            .eq('store_id', storeId)
            .eq('setting_key', setting.setting_key)
            .single()

          let error
          if (existing) {
            // 更新
            const result = await supabase
              .from('system_settings')
              .update({
                setting_value: setting.setting_value
              })
              .eq('store_id', storeId)
              .eq('setting_key', setting.setting_key)
            error = result.error
          } else {
            // 挿入
            const result = await supabase
              .from('system_settings')
              .insert({
                store_id: storeId,
                setting_key: setting.setting_key,
                setting_value: setting.setting_value
              })
            error = result.error
          }

          if (error) {
            console.error('Supabase error for', setting.setting_key, ':', error)
            throw new Error(`${setting.setting_key}の保存に失敗: ${error.message}`)
          }
        } catch (settingError: any) {
          console.error('Error saving setting:', setting.setting_key, settingError)
          throw new Error(`${setting.setting_key}の保存に失敗: ${settingError.message}`)
        }
      }

      alert('設定を保存しました')
    } catch (error: any) {
      console.error('Error saving system settings:', error)
      alert(`保存に失敗しました: ${error?.message || '不明なエラー'}`)
    } finally {
      setSaving(false)
    }
  }

  return {
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
    cardFeeRate,
    setCardFeeRate,
    loading,
    saving,
    loadAllSettings,
    saveSettings
  }
}
