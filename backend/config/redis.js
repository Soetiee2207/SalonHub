const Redis = require('ioredis');
require('dotenv').config();

let redis;

try {
  if (process.env.REDIS_URL) {
    // Kết nối qua URL (Thường dùng cho Upstash, Redis Cloud, Render)
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      tls: {}, // Bắt buộc phải có cái này để chạy với Upstash/Redis Online
    });
  } else if (process.env.REDIS_HOST) {
    // Kết nối qua thông số lẻ
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    });
  } else {
    console.warn('⚠️ Warning: No Redis configuration found. Caching will be disabled.');
  }

  if (redis) {
    redis.on('connect', () => {
      console.log('✅ Success: Connected to Redis Online.');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });
  }
} catch (error) {
  console.error('❌ Redis Initialization Error:', error.message);
}

module.exports = redis;
