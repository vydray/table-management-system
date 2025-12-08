import { useEffect } from 'react'
import { useSystemSettings } from '../../hooks/useSystemSettings'
import { NumericInput } from '../NumericInput'

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
    cardFeeRate,
    setCardFeeRate,
    allowMultipleNominations,
    setAllowMultipleNominations,
    allowMultipleCastsPerItem,
    setAllowMultipleCastsPerItem,
    loading,
    saving,
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
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
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
          <NumericInput
            value={taxRate}
            onChange={(value) => setTaxRate(value)}
            placeholder="0"
            min={0}
            max={100}
            allowDecimal={true}
            width="100px"
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
          <NumericInput
            value={serviceFeeRate}
            onChange={(value) => setServiceFeeRate(value)}
            placeholder="0"
            min={0}
            max={100}
            allowDecimal={true}
            width="100px"
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
          カード手数料率
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NumericInput
            value={cardFeeRate}
            onChange={(value) => setCardFeeRate(value)}
            placeholder="0"
            min={0}
            max={100}
            allowDecimal={true}
            width="100px"
          />
          <span style={{ fontSize: '16px' }}>%</span>
        </div>
        <p style={{
          color: '#666',
          fontSize: '13px',
          margin: '5px 0'
        }}>
          カード支払い時に加算される手数料の割合
        </p>
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
        <select
          value={roundingUnit}
          onChange={(e) => setRoundingUnit(Number(e.target.value))}
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
          <option value={1}>1円単位</option>
          <option value={10}>10円単位</option>
          <option value={100}>100円単位</option>
          <option value={1000}>1000円単位</option>
        </select>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={allowMultipleNominations}
            onChange={(e) => setAllowMultipleNominations(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          />
          複数推し機能
        </label>
        <p style={{
          color: '#666',
          fontSize: '13px',
          margin: '5px 0 0 30px'
        }}>
          1卓に複数の推しを設定できるようにします
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={allowMultipleCastsPerItem}
            onChange={(e) => setAllowMultipleCastsPerItem(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          />
          注文明細の複数キャスト
        </label>
        <p style={{
          color: '#666',
          fontSize: '13px',
          margin: '5px 0 0 30px'
        }}>
          1つの注文明細に複数のキャストを設定できるようにします（シャンパンなど共有商品用）
        </p>
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
              cursor: 'pointer',
              WebkitAppearance: 'menulist',
              appearance: 'auto',
              touchAction: 'manipulation',
              position: 'relative',
              zIndex: 9999,
              pointerEvents: 'auto'
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
          <NumericInput
            value={registerAmount}
            onChange={(value) => setRegisterAmount(value)}
            placeholder="0"
            min={0}
            width="150px"
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
          disabled={saving}
          style={{
            padding: '12px 40px',
            backgroundColor: saving ? '#ccc' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 保存中のオーバーレイ */}
      {saving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            fontSize: '24px',
            color: 'white',
            marginBottom: '20px'
          }}>
            保存中...
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255, 255, 255, 0.3)',
            borderTop: '5px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}