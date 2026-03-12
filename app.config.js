const path = require('path');
const fs = require('fs');

// Only set googleServicesFile when the plist exists (e.g. locally).
// For EAS Build: add config/firebase/GoogleService-Info.plist to the repo,
// or inject it via a build hook / EAS Secret so this path exists during prebuild.
const plistPath = path.resolve(__dirname, 'config/firebase/GoogleService-Info.plist');

const base = require('./app.json');

if (!fs.existsSync(plistPath)) {
  if (base.expo?.ios) {
    delete base.expo.ios.googleServicesFile;
  }
} else {
  base.expo.ios = base.expo.ios || {};
  base.expo.ios.googleServicesFile = './config/firebase/GoogleService-Info.plist';
}

module.exports = base;
