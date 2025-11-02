import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vydray.pos',
  appName: 'POS System',
  webDir: 'out',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  server: {
    // APK版はVercelのサイトを直接読み込む（APIルート経由でログイン）
    url: 'https://table-management-system-seven.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;