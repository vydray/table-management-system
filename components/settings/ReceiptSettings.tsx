import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'
import { printer } from '../../utils/bluetoothPrinter'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ReceiptSettings {
  store_name: string
  logo_url: string
  footer_message: string
  invoice_enabled: boolean
  invoice_number: string
  show_tax_breakdown: boolean
  current_receipt_number: number
}

export default function ReceiptSettings() {
  const [settings, setSettings] = useState<ReceiptSettings>({
    store_name: '',
    logo_url: '',
    footer_message: 'またのご来店をお待ちしております',
    invoice_enabled: false,
    invoice_number: '',
    show_tax_breakdown: false,
    current_receipt_number: 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)    // ← ここにある
  const [printerConnected, setPrinterConnected] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const storeId = getCurrentStoreId()
      
      // 既存の設定を読み込み
      const { data: receiptSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('store_id', storeId)
        .single()

      if (receiptSettings) {
        setSettings({
          store_name: receiptSettings.store_name || '',
          logo_url: receiptSettings.logo_url || '',
          footer_message: receiptSettings.footer_message || 'またのご来店をお待ちしております',
          invoice_enabled: receiptSettings.invoice_enabled || false,
          invoice_number: receiptSettings.invoice_number || '',
          show_tax_breakdown: receiptSettings.show_tax_breakdown || false,
          current_receipt_number: receiptSettings.current_receipt_number || 1
        })
        
        if (receiptSettings.logo_url) {
          setLogoPreview(receiptSettings.logo_url)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      const storeId = getCurrentStoreId()
      
      // ロゴ画像のアップロード処理
      let logoUrl = settings.logo_url
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${storeId}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(`logos/${fileName}`, logoFile)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(`logos/${fileName}`)
        
        logoUrl = publicUrl
      }
      
      // 設定を保存
      const { error } = await supabase
        .from('receipt_settings')
        .upsert({
          store_id: storeId,
          store_name: settings.store_name,
          logo_url: logoUrl,
          footer_message: settings.footer_message,
          invoice_enabled: settings.invoice_enabled,
          invoice_number: settings.invoice_number,
          show_tax_breakdown: settings.show_tax_breakdown,
          current_receipt_number: settings.current_receipt_number,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      alert('設定を保存しました')
      loadSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('設定の保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Bluetoothプリンター接続
  const connectBluetoothPrinter = async () => {
    setIsConnecting(true)
    try {
      // Bluetoothを有効化
      await printer.enable()
      
      // ペアリング済みデバイスを取得
      const devices = await printer.getPairedDevices()
      console.log('Paired devices:', devices)
      
      // MP-B20を探す
      const mp20 = devices.find(device => 
        device.name.includes('MP-B20') || 
        device.name.includes('MP-') ||
        device.name.includes('MPB20')
      )
      
      if (mp20) {
        await printer.connect(mp20.address)
        setPrinterConnected(true)
        alert('MP-B20に接続しました')
      } else {
        alert('MP-B20が見つかりません。\nAndroid設定でペアリングされているか確認してください。')
      }
    } catch (error) {
      console.error('Printer connection error:', error)
      alert('プリンター接続エラー: ' + error)
    } finally {
      setIsConnecting(false)
    }
  }

  // 直接印刷テスト
  const testDirectPrint = async () => {
    if (!printerConnected) {
      alert('プリンターが接続されていません')
      return
    }

    try {
      await printer.printReceipt({
        storeName: settings.store_name || 'テスト店舗',
        items: [
          { name: 'テスト商品1', price: 500, quantity: 1 },
          { name: 'テスト商品2', price: 300, quantity: 1 }
        ],
        subtotal: 800,
        tax: 80,
        total: 880,
        footerMessage: settings.footer_message
      })
      
      alert('印刷完了')
    } catch (error) {
      console.error('Print error:', error)
      alert('印刷エラー: ' + error)
    }
  }

  const containerStyle: React.CSSProperties = {
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '50px',
    ...(typeof window !== 'undefined' && {
      ['WebkitOverflowScrolling' as string]: 'touch',
      ['msOverflowStyle' as string]: '-ms-autohiding-scrollbar'
    })
  }

  return (
    <div style={containerStyle}>
      {/* 基本設定 */}
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
            店舗名
          </label>
          <input
            type="text"
            value={settings.store_name}
            onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
            placeholder="例：○○カフェ"
            style={{
              width: '100%',
              maxWidth: '400px',
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
            ロゴ画像
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {logoPreview && (
              <img 
                src={logoPreview} 
                alt="ロゴプレビュー"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '10px',
                  backgroundColor: '#f9f9f9'
                }}
              />
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
                <span style={{ fontWeight: 'bold' }}>税率ごとの内訳を表示する</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* プリンター設定 */}
      <div style={{ marginBottom: '40px' }}>
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={connectBluetoothPrinter}
              disabled={isConnecting || printerConnected}
              style={{
                padding: '10px 20px',
                backgroundColor: printerConnected ? '#4CAF50' : '#2196F3',
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
              {isConnecting ? '接続中...' : printerConnected ? '✓ 接続済み' : '🔗 MP-B20接続'}
            </button>
            
            <button
              onClick={testDirectPrint}
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
          </div>
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
            value={settings.current_receipt_number}
            onChange={(e) => setSettings({ ...settings, current_receipt_number: parseInt(e.target.value) || 1 })}
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
        position: 'sticky',
        bottom: '0',
        backgroundColor: 'white',
        padding: '20px 0',
        borderTop: '1px solid #eee'
      }}>
        <button
          onClick={saveSettings}
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