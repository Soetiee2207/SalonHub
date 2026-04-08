const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay');

/**
 * Sort object keys alphabetically
 */
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
    }
    return sorted;
}

/**
 * Generate VNPay payment URL
 * @param {Object} data { amount, txnRef, orderInfo, returnUrl, ipAddr }
 * @returns {string} URL
 */
function generateVnpayUrl({ amount, txnRef, orderInfo, returnUrl, ipAddr = '127.0.0.1' }) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    const tmnCode = vnpayConfig.tmnCode;
    const secretKey = vnpayConfig.hashSecret;
    const vnpUrl = vnpayConfig.url;
    const vnpReturnUrl = returnUrl || vnpayConfig.returnUrl;

    let vnpParams = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': txnRef,
        'vnp_OrderInfo': orderInfo,
        'vnp_OrderType': 'other',
        'vnp_Amount': Math.round(amount * 100),
        'vnp_ReturnUrl': vnpReturnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate,
    };

    vnpParams = sortObject(vnpParams);

    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;
    
    return `${vnpUrl}?${querystring.stringify(vnpParams, { encode: false })}`;
}

module.exports = {
    generateVnpayUrl,
    sortObject
};
