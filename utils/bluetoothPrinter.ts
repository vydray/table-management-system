// utils/bluetoothPrinter.ts

// ESC/POSコマンド
const ESC = '\x1B'
const GS = '\x1D'
const INIT = `${ESC}@`
const CUT = `${GS}V\x00`
const CENTER = `${ESC}a\x01`
const LEFT = `${ESC}a\x00`
const BOLD_ON = `${ESC}E\x01`
const BOLD_OFF = `${ESC}E\x00`

// Bluetooth Serialプラグインの型定義
interface BluetoothDevice {
  name: string
  address: string
  id: string
  class?: number
}

export class BluetoothPrinter {
  private isConnected: boolean = false
  private BluetoothSerial: any = null

  // プラグインを動的に取得
  private async getPlugin() {
    if (typeof window === 'undefined') {
      throw new Error('Window is not defined')
    }
    
    if (!this.BluetoothSerial) {
      // @ts-ignore
      const { BluetoothSerial } = await import('@capacitor-community/bluetooth-serial')
      this.BluetoothSerial = BluetoothSerial
    }
    
    return this.BluetoothSerial
  }

  // Bluetooth有効化
  async enable() {
    try {
      const plugin = await this.getPlugin()
      await plugin.enable()
      console.log('Bluetooth enabled')
    } catch (error) {
      console.error('Bluetooth enable error:', error)
      throw error
    }
  }

  // ペアリング済みデバイスを取得
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      const plugin = await this.getPlugin()
      const result = await plugin.getBondedDevices()
      console.log('Paired devices:', result.devices)
      return result.devices
    } catch (error) {
      console.error('Get paired devices error:', error)
      throw error
    }
  }

  // プリンターに接続（MACアドレスで接続）
  async connect(address: string) {
    try {
      const plugin = await this.getPlugin()
      await plugin.connect({ address })
      this.isConnected = true
      console.log('Connected to printer:', address)
    } catch (error) {
      console.error('Connection error:', error)
      throw error
    }
  }

  // 接続状態を確認
  async checkConnection() {
    try {
      const plugin = await this.getPlugin()
      const result = await plugin.isConnected()
      this.isConnected = result.isConnected
      return result.isConnected
    } catch (error) {
      console.error('Check connection error:', error)
      return false
    }
  }

  // 切断
  async disconnect() {
    try {
      const plugin = await this.getPlugin()
      await plugin.disconnect()
      this.isConnected = false
      console.log('Disconnected from printer')
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  // データ送信（文字列を直接送信）
  private async write(data: string) {
    if (!this.isConnected) {
      throw new Error('Printer not connected')
    }

    try {
      const plugin = await this.getPlugin()
      await plugin.write({ value: data })
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
      // 接続確認
      const connected = await this.checkConnection()
      if (!connected) {
        throw new Error('Printer not connected')
      }

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