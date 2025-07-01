import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vydray.pos',
  appName: 'POS System',
  webDir: 'out',
  server: {
    url: 'https://table-management-system-seven.vercel.app',
    cleartext: true
  }
};

export default config;