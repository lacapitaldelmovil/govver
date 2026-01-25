// Logo de Veracruz en base64
const fs = require('fs');
const path = require('path');

function getLogoBase64() {
  try {
    const logoPath = path.join(__dirname, '../../..', 'frontend/public/logo-veracruz.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return 'data:image/png;base64,' + logoBuffer.toString('base64');
  } catch (e) {
    return null;
  }
}

module.exports = { getLogoBase64 };
