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

  // プリンターに接続
  async connect(address: string): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      await plugin.connect({ address });
      this.isConnected = true;
      console.log('Connected to printer:', address);
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // 接続状態を確認
  async checkConnection(): Promise<boolean> {
    return this.isConnected;
  }

  // 切断
  async disconnect(): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return;
    }
    
    try {
      await plugin.disconnect();
      this.isConnected = false;
      console.log('Disconnected from printer');
    } catch (error) {
      console.error('Disconnect error:', error);
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
  }): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }
    
    try {
      await plugin.printReceipt({
        storeName: receiptData.storeName,
        footerMessage: receiptData.footerMessage
      });
      console.log('Receipt printed successfully');
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  // 会計伝票印刷（新規追加）
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