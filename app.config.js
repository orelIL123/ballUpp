const path = require('path');
const fs = require('fs');

// Only opt into native iOS Firebase config when explicitly requested.
// This app uses the Firebase JS SDK, so most builds do not need a native plist.
// If you later add native Firebase iOS features, set:
// EXPO_USE_IOS_GOOGLE_SERVICES=1
// and ensure config/firebase/GoogleService-Info.plist exists during prebuild.
const plistPath = path.resolve(__dirname, 'config/firebase/GoogleService-Info.plist');
const shouldUseGoogleServicesFile =
  process.env.EXPO_USE_IOS_GOOGLE_SERVICES === '1' && fs.existsSync(plistPath);

const base = require('./app.json');
const config = {
  ...base,
  expo: {
    ...base.expo,
    ios: {
      ...base.expo?.ios,
    },
  },
};

if (shouldUseGoogleServicesFile) {
  config.expo.ios.googleServicesFile = './config/firebase/GoogleService-Info.plist';
} else {
  delete config.expo.ios.googleServicesFile;
}

module.exports = config;
