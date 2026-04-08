const db = require('../models');
const { User } = db;
const { createNotification } = require('../controllers/notificationController');

/**
 * Cập nhật điểm tích lũy và thứ hạng khách hàng một cách an toàn (Atomically)
 * @param {number} userId - ID của khách hàng
 * @param {number} pointsToAdd - Số điểm cần cộng (đã chia cho 1000)
 * @param {object} transaction - Transaction của Sequelize (Tùy chọn nhưng khuyến khích)
 */
const updateCustomerLoyalty = async (userId, pointsToAdd, transaction = null) => {
  try {
    const points = Math.floor(pointsToAdd);
    if (!userId || points <= 0) return;

    // 1. Cộng điểm Atomic (Tránh tranh chấp dữ liệu)
    // increment sẽ tự động thực hiện: UPDATE users SET loyaltyPoints = loyaltyPoints + points WHERE id = userId
    await User.increment('loyaltyPoints', {
      by: points,
      where: { id: userId },
      transaction
    });

    // 2. Lấy thông tin user mới nhất để kiểm tra thăng hạng
    // Phải dùng transaction nếu có để đảm bảo đọc được giá trị vừa cập nhật
    const user = await User.findByPk(userId, { transaction });
    if (!user) return;

    const currentPoints = user.loyaltyPoints;
    let newRank = 'Silver';
    if (currentPoints >= 2000) newRank = 'Diamond';
    else if (currentPoints >= 500) newRank = 'Gold';

    // 3. Nếu thăng hạng, cập nhật và gửi thông báo
    if (newRank !== user.rank) {
      await User.update({ rank: newRank }, { 
        where: { id: userId },
        transaction 
      });
      
      await createNotification({
        userId,
        title: 'Chúc mừng! Thăng hạng thành viên',
        message: `Hệ thống ghi nhận tổng chi tiêu của Quý khách đã đạt mốc mới! Chúc mừng sư huynh/tỉ tỉ đã thăng hạng lên ${newRank}!`,
        type: 'info',
      });
    }
    
    console.log(`[Loyalty] Đã cộng ${points} điểm cho User #${userId}. Tổng hiện tại: ${currentPoints}`);
  } catch (error) {
    console.error('Lỗi khi tích điểm khách hàng:', error);
  }
};

module.exports = { updateCustomerLoyalty };
