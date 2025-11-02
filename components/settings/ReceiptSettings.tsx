// components/settings/ReceiptSettings.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // 新規追加フィールド
  store_postal_code: string
  store_address: string
  store_phone: string
  store_email: string
  business_hours: string
  closed_days: string
  store_registration_number: string
  show_revenue_stamp: boolean
  revenue_stamp_threshold: number
  receipt_templates: Array<{
    name: string
    text: string
    is_default: boolean
  }>
}

export default function ReceiptSettings() {
  const [settings, setSettings] = useState<ReceiptSettings>({
    store_name: '',
    logo_url: '',
    footer_message: 'またのご来店をお待ちしております',
    invoice_enabled: false,
    invoice_number: '',
    show_tax_breakdown: false,
    current_receipt_number: 1,
    // 新規追加フィールドのデフォルト値
    store_postal_code: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    business_hours: '',
    closed_days: '',
    store_registration_number: '',
    show_revenue_stamp: true,
    revenue_stamp_threshold: 50000,
    receipt_templates: [
      { name: 'お品代', text: 'お品代として', is_default: true },
      { name: '飲食代', text: '飲食代として', is_default: false },
      { name: 'サービス料', text: 'サービス料として', is_default: false }
    ]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [printerAddress, setPrinterAddress] = useState<string>('') // 接続中のプリンターアドレスを保持

  useEffect(() => {
    loadSettings()
    checkPrinterConnection() // プリンター接続状態を確認
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
          current_receipt_number: receiptSettings.current_receipt_number || 1,
          // 新規フィールド
          store_postal_code: receiptSettings.store_postal_code || '',
          store_address: receiptSettings.store_address || '',
          store_phone: receiptSettings.store_phone || '',
          store_email: receiptSettings.store_email || '',
          business_hours: receiptSettings.business_hours || '',
          closed_days: receiptSettings.closed_days || '',
          store_registration_number: receiptSettings.store_registration_number || '',
          show_revenue_stamp: receiptSettings.show_revenue_stamp ?? true,
          revenue_stamp_threshold: receiptSettings.revenue_stamp_threshold || 50000,
          receipt_templates: receiptSettings.receipt_templates || [
            { name: 'お品代', text: 'お品代として', is_default: true },
            { name: '飲食代', text: '飲食代として', is_default: false },
            { name: 'サービス料', text: 'サービス料として', is_default: false }
          ]
        })
        
        if (receiptSettings.logo_url) {
          setLogoPreview(receiptSettings.logo_url)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // プリンター接続状態を確認する関数
  const checkPrinterConnection = async () => {
    try {
      // Bluetoothが有効か確認
      await printer.enable()
      
      // 現在の接続状態を確認
      const isConnected = await printer.checkConnection()
      setPrinterConnected(isConnected)
      
      if (isConnected) {
        // 接続されている場合、デバイス情報を取得
        const devices = await printer.getPairedDevices()
        const mp20 = devices.find((device: any) => 
          device.name && (
            device.name.includes('MP-B20') || 
            device.name.includes('MP-') ||
            device.name.includes('MPB20')
          )
        )
        if (mp20) {
          setPrinterAddress(mp20.address)
        }
      }
    } catch (error) {
      console.error('接続状態確認エラー:', error)
      setPrinterConnected(false)
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
          // 新規フィールド
          store_postal_code: settings.store_postal_code,
          store_address: settings.store_address,
          store_phone: settings.store_phone,
          store_email: settings.store_email,
          business_hours: settings.business_hours,
          closed_days: settings.closed_days,
          store_registration_number: settings.store_registration_number,
          show_revenue_stamp: settings.show_revenue_stamp,
          revenue_stamp_threshold: settings.revenue_stamp_threshold,
          receipt_templates: settings.receipt_templates,
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

  // 但し書きテンプレートの追加
  const addTemplate = () => {
    setSettings({
      ...settings,
      receipt_templates: [
        ...settings.receipt_templates,
        { name: '', text: '', is_default: false }
      ]
    })
  }

  // 但し書きテンプレートの削除
  const removeTemplate = (index: number) => {
    const newTemplates = settings.receipt_templates.filter((_, i) => i !== index)
    setSettings({ ...settings, receipt_templates: newTemplates })
  }

  // 但し書きテンプレートの更新
  const updateTemplate = (index: number, field: 'name' | 'text' | 'is_default', value: string | boolean) => {
    const newTemplates = [...settings.receipt_templates]
    if (field === 'is_default' && value === true) {
      // 他のデフォルトを解除
      newTemplates.forEach((t, i) => {
        if (i !== index) t.is_default = false
      })
    }
    newTemplates[index] = { ...newTemplates[index], [field]: value }
    setSettings({ ...settings, receipt_templates: newTemplates })
  }

  // Bluetoothプリンター接続（改善版 - デバッグログ追加）
  const connectBluetoothPrinter = async () => {
    if (printerConnected) {
      console.log('既に接続済みです')
      return
    }

    setIsConnecting(true)
    try {
      console.log('=== Bluetooth接続開始 ===')

      // ステップ1: Bluetoothを有効化
      console.log('1. Bluetooth有効化中...')
      await printer.enable()
      console.log('✓ Bluetooth有効化成功')

      // ステップ2: ペアリング済みデバイスを取得
      console.log('2. ペアリング済みデバイスを検索中...')
      const devices = await printer.getPairedDevices()
      console.log(`✓ ${devices.length}個のデバイスが見つかりました`)

      // デバイス一覧を詳細表示
      devices.forEach((device: any, index: number) => {
        console.log(`  [${index + 1}] ${device.name || '(名前なし)'} - ${device.address || '(アドレス不明)'}`)
      })

      // ステップ3: MP-B20を探す（より柔軟な検索）
      console.log('3. MP-B20プリンターを検索中...')
      const mp20 = devices.find((device: any) => {
        const name = device.name || ''
        const address = device.address || ''

        // 名前での検索（大文字小文字を区別しない）
        const nameMatch = name.toUpperCase().includes('MP') &&
                         (name.toUpperCase().includes('B20') || name.toUpperCase().includes('B-20'))

        // アドレスでの検索（一部のデバイスは名前が表示されない場合がある）
        const hasAddress = address.length > 0

        console.log(`  検証: ${name} (${address}) - 名前一致: ${nameMatch}, アドレス有: ${hasAddress}`)

        return nameMatch || (hasAddress && name.length === 0) // 名前が空でアドレスがある場合も候補にする
      })

      if (mp20) {
        console.log(`✓ プリンター発見: ${mp20.name} (${mp20.address})`)

        // ステップ4: プリンターに接続
        console.log('4. プリンターに接続中...')
        await printer.connect(mp20.address)
        console.log('✓ 接続成功!')

        setPrinterConnected(true)
        setPrinterAddress(mp20.address)
        alert(`MP-B20に接続しました\n${mp20.name || 'プリンター'}\n${mp20.address}`)
      } else {
        console.error('✗ MP-B20が見つかりませんでした')
        console.log('ヒント: Androidの設定 > Bluetooth でプリンターとペアリングされているか確認してください')

        // デバイス一覧を表示
        const deviceList = devices.map((d: any) => `・${d.name || '(名前なし)'}`).join('\n')
        alert(
          'MP-B20が見つかりません。\n\n' +
          'ペアリング済みデバイス:\n' +
          (deviceList || '(デバイスなし)') +
          '\n\nAndroid設定でMP-B20とペアリングされているか確認してください。'
        )
      }
    } catch (error: any) {
      console.error('✗ プリンター接続エラー:', error)
      console.error('エラー詳細:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      let errorMessage = 'プリンター接続エラー:\n\n'

      if (error.message) {
        errorMessage += error.message + '\n\n'
      }

      if (error.message?.includes('enable')) {
        errorMessage += '解決策:\n' +
          '1. Androidの設定でBluetoothがONになっているか確認\n' +
          '2. アプリにBluetooth権限が許可されているか確認'
      } else if (error.message?.includes('connect')) {
        errorMessage += '解決策:\n' +
          '1. プリンターの電源がONになっているか確認\n' +
          '2. 他のデバイスに接続されていないか確認\n' +
          '3. プリンターを再起動してみてください'
      } else {
        errorMessage += '解決策:\n' +
          '1. プリンターの電源を確認\n' +
          '2. Bluetooth設定を確認\n' +
          '3. アプリを再起動してみてください'
      }

      alert(errorMessage)
      setPrinterConnected(false)
    } finally {
      setIsConnecting(false)
      console.log('=== Bluetooth接続処理終了 ===')
    }
  }

  // プリンター切断機能を追加
  const disconnectPrinter = async () => {
    try {
      await printer.disconnect()
      setPrinterConnected(false)
      setPrinterAddress('')
      alert('プリンターを切断しました')
    } catch (error) {
      console.error('切断エラー:', error)
    }
  }

  // 直接印刷テスト
  const testDirectPrint = async () => {
    if (!printerConnected) {
      alert('プリンターが接続されていません')
      return
    }

    try {
      // 現在の設定値を使用
      await printer.printReceipt({
        // 店舗情報（現在の設定値を使用）
        storeName: settings.store_name || 'テスト店舗',
        storeAddress: settings.store_address || '',
        storePhone: settings.store_phone || '',
        storePostalCode: settings.store_postal_code || '',
        storeRegistrationNumber: settings.store_registration_number || '',
        
        // テスト用の固定値
        receiptNumber: `TEST-${Date.now()}`,
        tableName: 'テスト',
        guestName: 'テストユーザー',
        castName: 'テストキャスト',
        timestamp: new Date().toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        
        // 宛名と但し書き
        receiptTo: 'テスト印刷',
        receiptNote: 'テスト印刷のため',
        
        // 収入印紙設定（現在の設定値を使用）
        showRevenueStamp: settings.show_revenue_stamp,
        revenueStampThreshold: settings.revenue_stamp_threshold,
        
        // テスト商品
        orderItems: [
          { name: 'テスト商品1', price: 500, quantity: 1 },
          { name: 'テスト商品2', price: 300, quantity: 1 }
        ],
        subtotal: 800,
        serviceTax: 120,
        consumptionTax: 92,
        roundingAdjustment: -12,
        roundedTotal: 1000,
        paymentCash: 1000,
        paymentCard: 0,
        paymentOther: 0,
        paymentOtherMethod: '',
        change: 0
      })
      
      alert('テスト印刷完了')
    } catch (error) {
      console.error('Print error:', error)
      alert('印刷エラー: ' + error)
    }
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
              value={settings.revenue_stamp_threshold}
              onChange={(e) => setSettings({ ...settings, revenue_stamp_threshold: parseInt(e.target.value) || 50000 })}
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