import { useState } from 'react'
import { printer } from '../utils/bluetoothPrinter'
import { ReceiptSettings } from './useReceiptSettingsData'

export const usePrinterConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [printerAddress, setPrinterAddress] = useState<string>('')

  // プリンター接続状態を確認する関数
  const checkPrinterConnection = async () => {
    try {
      await printer.enable()
      const isConnected = await printer.checkConnection()
      setPrinterConnected(isConnected)

      if (isConnected) {
        const devices = await printer.getPairedDevices()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Bluetoothプリンター接続
  const connectBluetoothPrinter = async () => {
    if (printerConnected) {
      return
    }

    setIsConnecting(true)
    try {
      await printer.enable()

      const devices = await printer.getPairedDevices()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mp20 = devices.find((device: any) => {
        const name = device.name || ''
        const address = device.address || ''

        const nameMatch = name.toUpperCase().includes('MP') &&
                         (name.toUpperCase().includes('B20') || name.toUpperCase().includes('B-20'))
        const hasAddress = address.length > 0

        return nameMatch || (hasAddress && name.length === 0)
      })

      if (mp20) {
        await printer.connect(mp20.address)

        setPrinterConnected(true)
        setPrinterAddress(mp20.address)
        alert(`MP-B20に接続しました\n${mp20.name || 'プリンター'}\n${mp20.address}`)
        return true
      } else {
        console.error('✗ MP-B20が見つかりませんでした')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deviceList = devices.map((d: any) => `・${d.name || '(名前なし)'}`).join('\n')
        alert(
          'MP-B20が見つかりません。\n\n' +
          'ペアリング済みデバイス:\n' +
          (deviceList || '(デバイスなし)') +
          '\n\nAndroid設定でMP-B20とペアリングされているか確認してください。'
        )
        return false
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('✗ プリンター接続エラー:', error)

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
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  // プリンター切断
  const disconnectPrinter = async () => {
    try {
      await printer.disconnect()
      setPrinterConnected(false)
      setPrinterAddress('')
      alert('プリンターを切断しました')
      return true
    } catch (error) {
      console.error('切断エラー:', error)
      return false
    }
  }

  // 直接印刷テスト
  const testDirectPrint = async (settings: ReceiptSettings) => {
    if (!printerConnected) {
      alert('プリンターが接続されていません')
      return false
    }

    try {
      await printer.printReceipt({
        storeName: settings.store_name || 'テスト店舗',
        storeAddress: settings.store_address || '',
        storePhone: settings.store_phone || '',
        storePostalCode: settings.store_postal_code || '',
        storeRegistrationNumber: settings.store_registration_number || '',
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
        receiptTo: 'テスト印刷',
        receiptNote: 'テスト印刷のため',
        showRevenueStamp: settings.show_revenue_stamp,
        revenueStampThreshold: settings.revenue_stamp_threshold,
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
      return true
    } catch (error) {
      console.error('Print error:', error)
      alert('印刷エラー: ' + error)
      return false
    }
  }

  return {
    isConnecting,
    printerConnected,
    printerAddress,
    checkPrinterConnection,
    connectBluetoothPrinter,
    disconnectPrinter,
    testDirectPrint
  }
}
