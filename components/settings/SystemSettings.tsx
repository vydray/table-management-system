import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SystemSettings() {
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5)
  const [taxRate, setTaxRate] = useState(10)
  const [serviceFeeRate, setServiceFeeRate] = useState(15)
  const [roundingType, setRoundingType] = useState('切り上げ')
  const [roundingUnit, setRoundingUnit] = useState(100)
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
          'rounding_unit'
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
        { setting_key: 'rounding_unit', setting_value: roundingUnit.toString() }
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

  useEffect(() => {
    loadAllSettings()
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>読み込み中...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          消費税率
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '100px'
            }}
          />
          <span style={{ fontSize: '16px' }}>%</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          サービス料率
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={serviceFeeRate}
            onChange={(e) => setServiceFeeRate(Number(e.target.value))}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '100px'
            }}
          />
          <span style={{ fontSize: '16px' }}>%</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          端数処理
        </label>
        <select
          value={roundingType}
          onChange={(e) => setRoundingType(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            width: '200px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="切り上げ">切り上げ</option>
          <option value="切り捨て">切り捨て</option>
          <option value="四捨五入">四捨五入</option>
        </select>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          端数単位
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={roundingUnit}
            onChange={(e) => setRoundingUnit(Number(e.target.value))}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '100px'
            }}
          />
          <span style={{ fontSize: '16px' }}>円</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          営業日切り替え時間
        </label>
        <div style={{ marginBottom: '10px' }}>
          <select
            value={businessDayStartHour}
            onChange={(e) => setBusinessDayStartHour(Number(e.target.value))}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '120px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, '0')}時
              </option>
            ))}
          </select>
          <span style={{ 
            marginLeft: '10px',
            fontSize: '14px',
            color: '#666'
          }}>
            （この時間を基準に前日/当日を判定）
          </span>
        </div>
        <p style={{ 
          color: '#666',
          fontSize: '13px',
          margin: '5px 0'
        }}>
          例：5時設定の場合、朝4:59までは前日、5:00以降は当日として集計されます
        </p>
      </div>

      <div style={{ 
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            style={{
              width: '18px',
              height: '18px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '16px' }}>推しを優先表示</span>
        </label>
        <p style={{ 
          marginTop: '10px',
          marginLeft: '28px',
          color: '#666',
          fontSize: '13px'
        }}>
          テーブル設定時の推しが、推し用・シャンパン・ノンアルシャンパンの選択時に一番上に表示されます
        </p>
      </div>

      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px'
      }}>
        <button
          onClick={saveSettings}
          style={{
            padding: '12px 40px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          保存
        </button>
      </div>
    </div>
  )
}