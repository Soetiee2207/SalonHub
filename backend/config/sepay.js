/**
 * SePay Configuration
 */
module.exports = {
  // API Key for SePay Webhook Authentication
  // You should set this in your .env file
  apiKey: process.env.SEPAY_API_KEY || 'your_sepay_api_key_here',

  // SePay Webhook IP Whitelist
  // If your server is behind a proxy, ensure you check the real IP
  ipWhitelist: [
    '172.236.138.20',
    '172.233.83.68',
    '171.244.35.2',
    '151.158.108.68',
    '151.158.109.79',
    '103.255.238.139'
  ],

  // Patterns for order/appointment matching
  patterns: {
    order: /^SH(\d+)$/i,      // SH12345
    appointment: /^AP(\d+)$/i // AP67890
  }
};
