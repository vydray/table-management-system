import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SystemSettings() {
  const [businessDayStartHour, setBusinessDayStartHour] = useState(5)

  // 営業日切り替え時間を保存
  const saveBusinessDayStartHour = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'business_day_start_hour',
          setting_value: businessDayStartHour,
          store_id: storeId
        }, {
          onConflict: 'setting_key,store_id'
        })

      if (error) throw error
      alert('営業日切り替え時間を保存しました')
    } catch (error) {
      console.error('Error saving business day start hour:', error)
      alert('保存に失敗しました')
    }
  }

  // 営業日切り替え時間を読み込む
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

  useEffect(() => {
    loadBusinessDayStartHour()
  }, [])

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>システム設定</h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>営業日切り替え時間</h3>
        <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
          この時間を境に営業日が切り替わります。深夜営業の場合に設定してください。
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={businessDayStartHour}
            onChange={(e) => setBusinessDayStartHour(Number(e.target.value))}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '120px'
            }}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
          <button
            onClick={saveBusinessDayStartHour}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4A90E2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}