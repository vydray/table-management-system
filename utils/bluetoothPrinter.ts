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

export class BluetoothPrinter {
  private isConnected: boolean = false;
  private currentAddress: string = '';  // 接続中のアドレスを保存

  // プラグインを取得
  private getPlugin() {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // @ts-ignore
    return window.Capacitor?.Plugins?.SiiPrinter || null;
  }

  // Bluetooth有効化
  async enable(): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      await plugin.enable();
      console.log('Bluetooth enabled');
    } catch (error) {
      console.error('Enable error:', error);
      throw error;
    }
  }

  // ペアリング済みデバイスを取得
  async getPairedDevices(): Promise<any[]> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      const result = await plugin.getPairedDevices();
      console.log('Paired devices:', result.devices);
      return result.devices || [];
    } catch (error) {
      console.error('Get paired devices error:', error);
      throw error;
    }
  }

  // プリンターに接続（修正版）
  async connect(address: string): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      // 既に接続されている場合は一度切断
      if (this.isConnected) {
        console.log('既存の接続を切断します');
        try {
          await plugin.disconnect();
        } catch (e) {
          console.error('切断エラー（無視）:', e);
        }
        this.isConnected = false;
      }
      
      await plugin.connect({ address });
      this.isConnected = true;
      this.currentAddress = address;
      console.log('Connected to printer:', address);
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.currentAddress = '';
      throw error;
    }
  }

  // 接続状態を確認（修正版）
  async checkConnection(): Promise<boolean> {
    // プラグインがない場合はfalse
    const plugin = this.getPlugin();
    if (!plugin) {
      this.isConnected = false;
      return false;
    }
    
    // 内部の接続状態を返す
    return this.isConnected;
  }

  // 切断（修正版）
  async disconnect(): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return;
    }
    
    try {
      await plugin.disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      // エラーがあっても内部状態はリセット
      this.isConnected = false;
      this.currentAddress = '';
    }
  }

  // 再接続機能を追加
  async reconnect(): Promise<void> {
    if (!this.currentAddress) {
      throw new Error('No previous connection address');
    }
    
    await this.connect(this.currentAddress);
  }

  // 会計伝票印刷
  async printOrderSlip(orderData: {
    tableName: string
    guestName: string
    castName: string
    elapsedTime: string
    orderItems: Array<{
      name: string
      cast?: string
      quantity: number
      price: number
    }>
    subtotal: number
    serviceTax: number
    roundedTotal: number
    roundingAdjustment: number
    timestamp: string
  }): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      await plugin.printOrderSlip({
        tableName: orderData.tableName,
        guestName: orderData.guestName,
        castName: orderData.castName,
        elapsedTime: orderData.elapsedTime,
        orderItems: orderData.orderItems,
        subtotal: orderData.subtotal,
        serviceTax: orderData.serviceTax,
        roundedTotal: orderData.roundedTotal,
        roundingAdjustment: orderData.roundingAdjustment,
        timestamp: orderData.timestamp
      });
      console.log('Order slip printed successfully');
    } catch (error) {
      console.error('Print order slip error:', error);
      throw error;
    }
  }

  // 領収書兼レシート印刷
async printReceipt(receiptData: {
  storeName: string
  storeAddress?: string
  storePhone?: string
  storePostalCode?: string  // 追加
  storeRegistrationNumber?: string  // 追加
  receiptNumber: string
  tableName: string
  guestName: string
  castName: string
  timestamp: string
  receiptTo?: string  // 追加（宛名）
  receiptNote?: string  // 追加（但し書き）
  showRevenueStamp?: boolean  // 追加（収入印紙表示）
  revenueStampThreshold?: number  // 追加（収入印紙閾値）
  orderItems: Array<{
    name: string
    cast?: string
    quantity: number
    price: number
  }>
  subtotal: number
  serviceTax: number
  consumptionTax: number
  roundingAdjustment: number
  roundedTotal: number
  paymentCash: number
  paymentCard: number
  paymentOther: number
  paymentOtherMethod?: string
  change: number
}): Promise<void> {
  const plugin = this.getPlugin();
  if (!plugin) {
    throw new Error('SiiPrinter plugin not available');
  }
  
  try {
    await plugin.printReceipt(receiptData);
    console.log('Receipt printed successfully');
  } catch (error) {
    console.error('Print receipt error:', error);
    throw error;
  }
}

  // テスト印刷
  async printTest(): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      await plugin.printText({ text: 'MP-B20 テスト印刷\n\n接続成功!\n\n\n' });
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const printer = new BluetoothPrinter();