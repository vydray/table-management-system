import { useEffect } from 'react'
import { useSystemSettings } from '../../hooks/useSystemSettings'

export default function SystemSettings() {
  const {
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
  } = useSystemSettings()

  useEffect(() => {
    loadAllSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>読み込み中...</div>
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: '0',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: '-ms-autohiding-scrollbar'
    }}>
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

      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          レジ金
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={registerAmount}
            onChange={(e) => setRegisterAmount(Number(e.target.value))}
            step="1000"
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '150px'
            }}
          />
          <span style={{ fontSize: '16px' }}>円</span>
        </div>
        <p style={{ 
          color: '#666',
          fontSize: '13px',
          margin: '5px 0'
        }}>
          レジに常時保管する釣り銭準備金の金額
        </p>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '220px',
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        zIndex: 10
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