// utils/bluetoothPrinter.ts

// Cordova Bluetooth Serialのグローバル変数
declare let bluetoothSerial: any;

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
  private isConnected: boolean = false

  // プラグインが利用可能か確認
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof bluetoothSerial !== 'undefined'
  }

  // Bluetooth有効化
  async enable(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Bluetooth Serial not available')
    }

    return new Promise((resolve, reject) => {
      bluetoothSerial.enable(
        () => {
          console.log('Bluetooth enabled')
          resolve()
        },
        (error: any) => {
          console.error('Enable error:', error)
          reject(error)
        }
      )
    })
  }

  // ペアリング済みデバイスを取得
  async getPairedDevices(): Promise<any[]> {
    if (!this.isAvailable()) {
      throw new Error('Bluetooth Serial not available')
    }

    return new Promise((resolve, reject) => {
      bluetoothSerial.list(
        (devices: any[]) => {
          console.log('Paired devices:', devices)
          // Cordovaプラグインはnameとaddressプロパティを持つ
          resolve(devices)
        },
        (error: any) => {
          console.error('List error:', error)
          reject(error)
        }
      )
    })
  }

  // プリンターに接続
  async connect(address: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Bluetooth Serial not available')
    }

    return new Promise((resolve, reject) => {
      bluetoothSerial.connect(
        address,
        () => {
          this.isConnected = true
          console.log('Connected to:', address)
          resolve()
        },
        (error: any) => {
          console.error('Connection error:', error)
          reject(error)
        }
      )
    })
  }

  // 接続状態を確認
  async checkConnection(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    return new Promise((resolve) => {
      bluetoothSerial.isConnected(
        () => {
          this.isConnected = true
          resolve(true)
        },
        () => {
          this.isConnected = false
          resolve(false)
        }
      )
    })
  }

  // 切断
  async disconnect(): Promise<void> {
    if (!this.isAvailable()) {
      return
    }

    return new Promise((resolve) => {
      bluetoothSerial.disconnect(
        () => {
          this.isConnected = false
          console.log('Disconnected')
          resolve()
        },
        () => resolve()
      )
    })
  }

  // データ送信
  private async write(data: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Bluetooth Serial not available')
    }

    if (!this.isConnected) {
      throw new Error('Not connected')
    }

    return new Promise((resolve, reject) => {
      bluetoothSerial.write(
        data,
        () => resolve(),
        (error: any) => {
          console.error('Write error:', error)
          reject(error)
        }
      )
    })
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
  }): Promise<void> {
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