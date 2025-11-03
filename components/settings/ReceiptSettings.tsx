// components/settings/ReceiptSettings.tsx
import { useEffect } from 'react'
import { useReceiptSettingsData } from '../../hooks/useReceiptSettingsData'
import { useLogoUpload } from '../../hooks/useLogoUpload'
import { useReceiptTemplate } from '../../hooks/useReceiptTemplate'
import { usePrinterConnection } from '../../hooks/usePrinterConnection'

export default function ReceiptSettings() {
  // フックを使用
  const {
    settings,
    setSettings,
    isLoading,
    loadSettings,
    saveSettings
  } = useReceiptSettingsData()

  const {
    logoPreview,
    setLogoPreview,
    handleLogoChange,
    uploadLogo
  } = useLogoUpload()

  const {
    addTemplate,
    removeTemplate,
    updateTemplate
  } = useReceiptTemplate(settings, setSettings)

  const {
    isConnecting,
    printerConnected,
    printerAddress,
    checkPrinterConnection,
    connectBluetoothPrinter,
    disconnectPrinter,
    testDirectPrint
  } = usePrinterConnection()

  // 初期ロード
  useEffect(() => {
    const loadData = async () => {
      const logoUrl = await loadSettings()
      if (logoUrl) {
        setLogoPreview(logoUrl)
      }
    }
    loadData()
    checkPrinterConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 保存処理のラッパー関数（ロゴアップロード + 設定保存を統合）
  const handleSaveSettings = async () => {
    try {
      // ロゴをアップロード（ファイルが選択されている場合）
      const logoUrl = await uploadLogo()

      // 設定を保存（ロゴURLを渡す）
      await saveSettings(logoUrl || undefined)
    } catch (error) {
      console.error('保存エラー:', error)
    }
  }

  // プリンター印刷テストのラッパー関数
  const handleTestPrint = async () => {
    await testDirectPrint(settings)
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '30px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        marginTop: 0,
        marginBottom: '30px',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        レシート設定
      </h2>

      {/* プリンター設定 */}
      <div id="printer-settings" style={{ marginBottom: '40px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          プリンター設定
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <p style={{
            marginBottom: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            Bluetooth対応のレシートプリンター（MP-B20）と接続します
          </p>

          {/* 接続状態の表示 */}
          {printerConnected && (
            <div style={{
              padding: '10px',
              backgroundColor: '#e8f5e9',
              borderRadius: '5px',
              marginBottom: '15px',
              fontSize: '14px',
              color: '#2e7d32'
            }}>
              ✓ MP-B20に接続済み
              {printerAddress && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>({printerAddress})</span>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            {!printerConnected ? (
              // 未接続時：接続ボタンを表示
              <button
                onClick={connectBluetoothPrinter}
                disabled={isConnecting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isConnecting ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isConnecting ? '接続中...' : '🔗 MP-B20接続'}
              </button>
            ) : (
              // 接続済み時：切断ボタンを表示
              <button
                onClick={disconnectPrinter}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔌 接続を切断
              </button>
            )}

            <button
              onClick={handleTestPrint}
              disabled={!printerConnected}
              style={{
                padding: '10px 20px',
                backgroundColor: printerConnected ? '#FF9800' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: printerConnected ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🖨️ 直接印刷テスト
            </button>

            {/* 再確認ボタン（デバッグ用） */}
            <button
              onClick={checkPrinterConnection}
              style={{
                padding: '10px 20px',
                backgroundColor: '#9E9E9E',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title="接続状態を再確認"
            >
              🔄 状態確認
            </button>
          </div>
        </div>
      </div>

      {/* 店舗情報 */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          店舗情報
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              店舗名 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              placeholder="例：○○店"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              郵便番号 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={settings.store_postal_code}
              onChange={(e) => setSettings({ ...settings, store_postal_code: e.target.value })}
              placeholder="例：123-4567"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            住所 <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={settings.store_address}
            onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
            placeholder="例：東京都渋谷区○○1-2-3 ○○ビル4F"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              電話番号 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={settings.store_phone}
              onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
              placeholder="例：03-1234-5678"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={settings.store_email}
              onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
              placeholder="例：info@example.com"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              営業時間
            </label>
            <input
              type="text"
              value={settings.business_hours}
              onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
              placeholder="例：18:00-24:00"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              定休日
            </label>
            <input
              type="text"
              value={settings.closed_days}
              onChange={(e) => setSettings({ ...settings, closed_days: e.target.value })}
              placeholder="例：日曜日・祝日"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 但し書きテンプレート */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          但し書きテンプレート
        </h3>
        
        {settings.receipt_templates.map((template, index) => (
          <div key={index} style={{ 
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <input
              type="text"
              value={template.name}
              onChange={(e) => updateTemplate(index, 'name', e.target.value)}
              placeholder="表示名"
              style={{
                width: '150px',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
            <input
              type="text"
              value={template.text}
              onChange={(e) => updateTemplate(index, 'text', e.target.value)}
              placeholder="但し書き内容"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="default_template"
                checked={template.is_default}
                onChange={() => updateTemplate(index, 'is_default', true)}
              />
              デフォルト
            </label>
            <button
              onClick={() => removeTemplate(index)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              削除
            </button>
          </div>
        ))}
        
        <button
          onClick={addTemplate}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + テンプレート追加
        </button>
      </div>

      {/* 収入印紙設定 */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          収入印紙設定
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.show_revenue_stamp}
              onChange={(e) => setSettings({ ...settings, show_revenue_stamp: e.target.checked })}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontWeight: 'bold' }}>収入印紙欄を表示する</span>
          </label>
        </div>

        {settings.show_revenue_stamp && (
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              収入印紙が必要な金額（円以上）
            </label>
            <input
              type="number"
              value={settings.revenue_stamp_threshold === 0 ? '' : settings.revenue_stamp_threshold}
              onChange={(e) => setSettings({ ...settings, revenue_stamp_threshold: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
              style={{
                width: '200px',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
            <p style={{ 
              marginTop: '5px',
              fontSize: '12px',
              color: '#666'
            }}>
              設定金額以上の場合、領収書に収入印紙欄が表示されます
            </p>
          </div>
        )}
      </div>

      {/* 基本設定（既存の部分） */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          基本設定
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            店舗ロゴ
          </label>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
           }}>
            {logoPreview && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={logoPreview}        // ← 変数に修正
                  alt="店舗ロゴ"          // ← 適切な説明に修正
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    padding: '5px'
                  }}
                />
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            レシート下部メッセージ
          </label>
          <textarea
            value={settings.footer_message}
            onChange={(e) => setSettings({ ...settings, footer_message: e.target.value })}
            placeholder="例：またのご来店をお待ちしております"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              minHeight: '60px'
            }}
          />
        </div>
      </div>

      {/* インボイス設定 */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          インボイス設定
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.invoice_enabled}
              onChange={(e) => setSettings({ ...settings, invoice_enabled: e.target.checked })}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontWeight: 'bold' }}>インボイス対応を有効にする</span>
          </label>
        </div>

        {settings.invoice_enabled && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                適格請求書発行事業者番号
              </label>
              <input
                type="text"
                value={settings.invoice_number}
                onChange={(e) => setSettings({ ...settings, invoice_number: e.target.value })}
                placeholder="T1234567890123"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                登録番号
              </label>
              <input
                type="text"
                value={settings.store_registration_number}
                onChange={(e) => setSettings({ ...settings, store_registration_number: e.target.value })}
                placeholder="例：T1234567890123"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.show_tax_breakdown}
              onChange={(e) => setSettings({ ...settings, show_tax_breakdown: e.target.checked })}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontWeight: 'bold' }}>税率ごとの内訳を表示</span>
          </label>
          <p style={{ 
            marginLeft: '28px',
            marginTop: '5px',
            fontSize: '12px',
            color: '#666'
          }}>
            8%（軽減税率）と10%（標準税率）の内訳を表示します
          </p>
        </div>
      </div>
      {/* レシート番号 */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          レシート番号管理
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            現在のレシート番号
          </label>
          <input
            type="number"
            value={settings.current_receipt_number === 0 ? '' : settings.current_receipt_number}
            onChange={(e) => setSettings({ ...settings, current_receipt_number: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
            style={{
              width: '200px',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
          <p style={{ 
            marginTop: '5px',
            fontSize: '12px',
            color: '#666'
          }}>
            次回の領収書はこの番号から開始されます
          </p>
        </div>
      </div>

      {/* 保存ボタン */}
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
          onClick={handleSaveSettings}
          disabled={isLoading}
          style={{
            padding: '12px 40px',
            backgroundColor: isLoading ? '#ccc' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  )
}