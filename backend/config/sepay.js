/**
 * SePay Configuration
 */
module.exports = {
  apiKey: process.env.SEPAY_API_KEY || 'your_sepay_api_key_here',

  ipWhitelist: [
    '172.236.138.20',
    '172.233.83.68',
    '171.244.35.2',
    '151.158.108.68',
    '151.158.109.79',
    '103.255.238.139'
  ],

  patterns: {
    order: /^SH(\d+)$/i,      // SH12345
    appointment: /^AP(\d+)$/i // AP67890
  }
};
