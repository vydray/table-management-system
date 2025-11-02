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
    url: undefined,
    cleartext: true,
    // APK版は login-apk.html から開始
    androidScheme: 'https'
  }
};

export default config;