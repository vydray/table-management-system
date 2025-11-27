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
      return result.devices || [];
    } catch (error) {
      console.error('Get paired devices error:', error);
      throw error;
    }
  }

  // プリンターに接続（改善版 - タイムアウトとリトライ追加）
  async connect(address: string, retries: number = 2): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('SiiPrinter plugin not available');
    }

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        // 既に接続されている場合は一度切断
        if (this.isConnected) {
          try {
            await plugin.disconnect();
            // 切断後少し待つ
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (e) {
            console.error('切断エラー（無視）:', e);
          }
          this.isConnected = false;
        }

        await plugin.connect({ address });

        // 接続成功後、少し待って確認
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.isConnected = true;
        this.currentAddress = address;
        return; // 成功したら終了

      } catch (error: any) {
        console.error(`✗ 接続試行 ${attempt} 失敗:`, error);

        this.isConnected = false;
        this.currentAddress = '';

        // 最後の試行でなければリトライ
        if (attempt < retries + 1) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          // 全ての試行が失敗
          console.error('全ての接続試行が失敗しました');

          // より詳細なエラーメッセージ
          if (error.message?.includes('already connected')) {
            throw new Error('プリンターは既に他のデバイスに接続されています。プリンターを再起動してください。');
          } else if (error.message?.includes('connection refused')) {
            throw new Error('プリンターが接続を拒否しました。プリンターの電源を確認してください。');
          } else if (error.message?.includes('timeout')) {
            throw new Error('接続がタイムアウトしました。プリンターの電源とBluetooth設定を確認してください。');
          } else {
            throw new Error(`接続エラー: ${error.message || '不明なエラー'}`);
          }
        }
      }
    }
  }

  // 接続状態を確認（改善版）
  async checkConnection(): Promise<boolean> {
    // プラグインがない場合はfalse
    const plugin = this.getPlugin();
    if (!plugin) {
      this.isConnected = false;
      return false;
    }
    
    // 実際にプリンターと通信して接続を確認する方法
    // （簡易的な実装：内部状態を返す）
    // より確実にしたい場合は、実際にプリンターにpingを送るなどの実装が必要
    
    try {
      // Bluetoothが有効か確認
      await plugin.enable();
      
      // 現在のアドレスが設定されていて、接続フラグがtrueの場合
      if (this.currentAddress && this.isConnected) {
        // ペアリング済みデバイスを確認
        const result = await plugin.getPairedDevices();
        const devices = result.devices || [];
        
        // 現在のアドレスがペアリング済みデバイスに存在するか確認
        const deviceExists = devices.some((device: any) => 
          device.address === this.currentAddress
        );
        
        if (!deviceExists) {
          // デバイスが見つからない場合は切断されたとみなす
          this.isConnected = false;
          this.currentAddress = '';
        }
      }
      
      return this.isConnected;
    } catch (error) {
      console.error('接続確認エラー:', error);
      this.isConnected = false;
      return false;
    }
  }

  // 現在接続中のアドレスを取得
  getCurrentAddress(): string {
    return this.currentAddress;
  }

  // 接続状態をリセット（アプリ起動時など）
  resetConnectionState(): void {
    this.isConnected = false;
    this.currentAddress = '';
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
    cardFeeRate?: number  // カード手数料率（%）
    cardFee?: number  // カード手数料
    roundingUnit?: number  // 端数単位
    roundingMethod?: number  // 端数処理方法
    paymentCash?: number  // 現金支払い
    paymentCard?: number  // カード支払い
    paymentOther?: number  // その他支払い
    paymentOtherMethod?: string  // その他支払い方法
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
        cardFeeRate: orderData.cardFeeRate,
        cardFee: orderData.cardFee,
        roundingUnit: orderData.roundingUnit,
        roundingMethod: orderData.roundingMethod,
        paymentCash: orderData.paymentCash,
        paymentCard: orderData.paymentCard,
        paymentOther: orderData.paymentOther,
        paymentOtherMethod: orderData.paymentOtherMethod,
        timestamp: orderData.timestamp
      });
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
    cardFeeRate?: number  // カード手数料率（%）
    cardFee?: number  // カード手数料
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