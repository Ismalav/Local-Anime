import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL?.trim() || 'https://openanimee.netlify.app';

const config: CapacitorConfig = {
  appId: 'com.ismalav.localanime',
  appName: 'Local Anime',
  webDir: '.next',
  server: {
    url: serverUrl,
    cleartext: false,
  },
};

export default config;
