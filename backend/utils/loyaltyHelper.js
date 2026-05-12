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

    await User.increment('loyaltyPoints', {
      by: points,
      where: { id: userId },
      transaction
    });

    const user = await User.findByPk(userId, { transaction });
    if (!user) return;

    const currentPoints = user.loyaltyPoints;
    let newRank = 'Silver';
    if (currentPoints >= 2000) newRank = 'Diamond';
    else if (currentPoints >= 500) newRank = 'Gold';

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
