// utils/bluetoothPrinter.ts

import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le'

// MP-B20のサービスとキャラクタリスティックUUID
const PRINTER_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455'
const PRINTER_WRITE_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3'

// ESC/POSコマンド
const ESC = '\x1B'
const GS = '\x1D'
const INIT = `${ESC}@`
const CUT = `${GS}V\x00`
const CENTER = `${ESC}a\x01`
const LEFT = `${ESC}a\x00`
const BOLD_ON = `${ESC}E\x01`
const BOLD_OFF = `${ESC}E\x00`

export class BluetoothPrinter {
  private deviceId: string | null = null
  private isConnected: boolean = false

  // 初期化
  async initialize() {
    try {
      await BleClient.initialize()
      console.log('Bluetooth initialized')
    } catch (error) {
      console.error('Bluetooth initialization error:', error)
      throw error
    }
  }

  // デバイススキャン
  async scanForPrinters(): Promise<BleDevice[]> {
    const devices: BleDevice[] = []
    
    try {
      await BleClient.requestLEScan(
        { name: 'MP-B20' },
        (result) => {
          console.log('Found device:', result.device)
          devices.push(result.device)
        }
      )

      // 5秒間スキャン
      await new Promise(resolve => setTimeout(resolve, 5000))
      await BleClient.stopLEScan()
      
      return devices
    } catch (error) {
      console.error('Scan error:', error)
      throw error
    }
  }

  // プリンターに接続
  async connect(deviceId: string) {
    try {
      await BleClient.connect(deviceId, () => {
        console.log('Disconnected from printer')
        this.isConnected = false
      })
      
      this.deviceId = deviceId
      this.isConnected = true
      console.log('Connected to printer')
    } catch (error) {
      console.error('Connection error:', error)
      throw error
    }
  }

  // 切断
  async disconnect() {
    if (this.deviceId) {
      try {
        await BleClient.disconnect(this.deviceId)
        this.isConnected = false
        this.deviceId = null
      } catch (error) {
        console.error('Disconnect error:', error)
      }
    }
  }

  // データ送信
  private async write(data: string) {
    if (!this.deviceId || !this.isConnected) {
      throw new Error('Printer not connected')
    }

    try {
      // 文字列をバイト配列に変換
      const encoder = new TextEncoder()
      const bytes = encoder.encode(data)
      
      // Bluetoothで送信
      await BleClient.write(
        this.deviceId,
        PRINTER_SERVICE_UUID,
        PRINTER_WRITE_UUID,
        new DataView(bytes.buffer)
      )
    } catch (error) {
      console.error('Write error:', error)
      throw error
    }
  }

  // レシート印刷
  async printReceipt(receiptData: {
    storeName: string
    tableNumber?: string
    staffName?: string
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    subtotal: number
    tax: number
    total: number
    footerMessage: string
  }) {
    try {
      // 初期化
      await this.write(INIT)
      
      // 店舗名（中央揃え、太字）
      await this.write(CENTER + BOLD_ON)
      await this.write(receiptData.storeName + '\n')
      await this.write(BOLD_OFF + LEFT)
      
      // 日時
      await this.write('\n')
      await this.write(`日時: ${new Date().toLocaleString('ja-JP')}\n`)
      
      // テーブル・スタッフ
      if (receiptData.tableNumber) {
        await this.write(`テーブル: ${receiptData.tableNumber}\n`)
      }
      if (receiptData.staffName) {
        await this.write(`担当: ${receiptData.staffName}\n`)
      }
      
      // 区切り線
      await this.write('-'.repeat(32) + '\n')
      
      // 商品リスト
      for (const item of receiptData.items) {
        const itemTotal = item.price * item.quantity
        await this.write(`${item.name}\n`)
        await this.write(`  ${item.quantity}個 × ¥${item.price} = ¥${itemTotal}\n`)
      }
      
      // 区切り線
      await this.write('-'.repeat(32) + '\n')
      
      // 合計
      await this.write(`小計: ¥${receiptData.subtotal}\n`)
      await this.write(`消費税: ¥${receiptData.tax}\n`)
      await this.write('-'.repeat(32) + '\n')
      await this.write(BOLD_ON)
      await this.write(`合計: ¥${receiptData.total}\n`)
      await this.write(BOLD_OFF)
      
      // フッター
      await this.write('\n')
      await this.write(CENTER)
      await this.write(receiptData.footerMessage + '\n')
      await this.write(LEFT)
      
      // カット
      await this.write('\n\n\n')
      await this.write(CUT)
      
      console.log('Receipt printed successfully')
    } catch (error) {
      console.error('Print error:', error)
      throw error
    }
  }
}

// シングルトンインスタンス
export const printer = new BluetoothPrinter()