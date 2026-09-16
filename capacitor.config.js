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
      // The WEB client of our Firebase project (client_type 3 in
      // google-services.json). The native sign-in mints its idToken for this
      // audience — WITHOUT this the token carries an uncontrolled/absent aud
      // and our backend (which checks `aud` against its trusted list) rejects
      // it with 401 "Invalid Google token" on EVERY native Google login.
      serverClientId:
        '198695262834-mhkn0smu2mqqdfj4toer7a8ld8q5nm63.apps.googleusercontent.com',
    },
  },
};

module.exports = config;
