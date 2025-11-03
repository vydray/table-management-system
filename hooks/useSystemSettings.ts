// SystemSettings.tsx用の一時的なスタブ
// TODO: SystemSettings.tsxの最適化時に完全実装する
import { useState } from 'react'

export const useSystemSettings = () => {
  const [businessDayStartHour, setBusinessDayStartHour] = useState(18)
  const [taxRate, setTaxRate] = useState(10)
  const [serviceFeeRate, setServiceFeeRate] = useState(15)
  const [roundingType, setRoundingType] = useState('四捨五入')
  const [roundingUnit, setRoundingUnit] = useState(100)
  const [registerAmount, setRegisterAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadAllSettings = async () => {
    setLoading(true)
    // TODO: 実装が必要
    setLoading(false)
  }

  const saveSettings = async () => {
    // TODO: 実装が必要
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
    loading,
    loadAllSettings,
    saveSettings
  }
}
