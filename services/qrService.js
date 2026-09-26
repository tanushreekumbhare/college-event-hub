const QRCode = require('qrcode');

/**
 * Generate QR Code data URL for a given registration ID
 */
const generateRegistrationQR = async (registrationId) => {
  try {
    const payload = JSON.stringify({
      registrationId: registrationId.toString(),
      system: 'CollegeEventHub'
    });
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

module.exports = {
  generateRegistrationQR
};
