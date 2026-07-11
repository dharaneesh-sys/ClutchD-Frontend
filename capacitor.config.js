/// <reference types="@capacitor-firebase/authentication" />

const config = {
  appId: 'com.clutchd.app',
  appName: 'ClutchD',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

module.exports = config;
