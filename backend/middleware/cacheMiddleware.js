const redis = require('../config/redis');

/**
 * Cache Middleware
 * @param {string} keyPrefix - Tiền tố của key (ví dụ: 'products', 'services')
 * @param {number} duration - Thời gian sống của cache tính bằng giây (mặc định 1 giờ)
 */
const cache = (keyPrefix, duration = 3600) => {
  return async (req, res, next) => {
    if (!redis) return next();

    // Tạo key dựa trên prefix + URL + query params (để phân biệt filter/sort)
    const key = `${keyPrefix}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        console.log(`⚡ [Redis] Cache Hit: ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`🌀 [Redis] Cache Miss: ${key}. Fetching from DB...`);
      
      // Ghi đè hàm res.json để tự động lưu vào cache sau khi lấy từ DB
      const originalJson = res.json;
      res.json = function(data) {
        if (data && data.success) {
          redis.setex(key, duration, JSON.stringify(data)).catch(err => {
            console.error('❌ Redis Set Error:', err.message);
          });
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('❌ Redis Middleware Error:', error.message);
      next(); // Vẫn tiếp tục chạy nếu Redis lỗi (không làm hỏng App)
    }
  };
};

module.exports = cache;
