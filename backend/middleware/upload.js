const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  },
});

// Bọc uploadSingle để nếu Cloudinary lỗi thì vẫn tiếp tục (không có ảnh)
const uploadSingle = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('⚠️ Upload ảnh thất bại (Cloudinary):', err.message);
      // Không crash - tiếp tục tạo bản ghi mà không có ảnh
      req.file = null;
    }
    next();
  });
};

// Multiple files upload (max 5)
const uploadMultiple = upload.array('images', 5);

module.exports = { uploadSingle, uploadMultiple };
