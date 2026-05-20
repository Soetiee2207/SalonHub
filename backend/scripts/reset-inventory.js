const db = require('../models');

const resetInventory = async () => {
  console.log('🚀 Bắt đầu reset toàn bộ dữ liệu tồn kho...');
  try {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🔄 Đang reset tồn kho trong bảng products về 0...');
    await db.Product.update({ stock: 0, reservedStock: 0 }, { where: {} });

    console.log('🗑️  Đang làm trống bảng product_batches...');
    await db.ProductBatch.destroy({ where: {}, truncate: true });

    console.log('🗑️  Đang làm trống bảng inventory_transactions...');
    await db.InventoryTransaction.destroy({ where: {}, truncate: true });

    console.log('🗑️  Đang xóa các giao dịch chi tiền mua hàng...');
    await db.CashFlowTransaction.destroy({ where: { referenceType: 'inventory_import' } });

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🧹 Xóa cache sản phẩm trên Redis...');
    try {
      const redis = require('../config/redis');
      if (redis) {
        const keys = await redis.keys('products:*');
        if (keys.length > 0) {
          await redis.del(keys);
          console.log('✅ Đã xóa cache Redis thành công.');
        } else {
          console.log('ℹ️ Không có cache products:* trên Redis.');
        }
      } else {
        console.log('ℹ️ Redis không cấu hình hoặc bị tắt.');
      }
    } catch (redisError) {
      console.warn('⚠️ Lỗi xóa cache Redis (bỏ qua):', redisError.message);
    }

    console.log('✨ HOÀN THÀNH RESET DỮ LIỆU KHO THÀNH CÔNG!');
    process.exit(0);
  } catch (error) {
    console.error('❌ LỖI KHI RESET DỮ LIỆU KHO:', error);
    process.exit(1);
  }
};

resetInventory();
