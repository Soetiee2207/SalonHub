const { User, sequelize } = require('./models/index');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

async function fixAccounts() {
  try {
    console.log('--- Bắt đầu cập nhật tài khoản ---');
    
    // Hash mật khẩu '123456'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 1. Cập nhật tất cả mật khẩu hiện có thành '123456'
    const [updatedCount] = await User.update(
      { password: hashedPassword },
      { where: {} }
    );
    console.log(`- Đã cập nhật mật khẩu cho ${updatedCount} người dùng hiện có.`);

    // 2. Kiểm tra và tạo các tài khoản test quan trọng
    const testAccounts = [
      {
        email: 'admin@salonhub.vn',
        fullName: 'Hệ thống Admin',
        role: 'admin',
        phone: '0900000001'
      },
      {
        email: 'warehouse@salonhub.vn',
        fullName: 'Nhân viên Kho mẫu',
        role: 'warehouse_staff',
        phone: '0900000002'
      },
      {
        email: 'accountant@salonhub.vn',
        fullName: 'Kế toán mẫu',
        role: 'accountant',
        phone: '0900000003'
      }
    ];

    for (const acc of testAccounts) {
      const [user, created] = await User.findOrCreate({
        where: { email: acc.email },
        defaults: {
          ...acc,
          password: hashedPassword
        }
      });

      if (created) {
        console.log(`- Đã tạo mới tài khoản: ${acc.email} (${acc.role})`);
      } else {
        // Đảm bảo role đúng cho tài khoản hiện có
        user.role = acc.role;
        user.password = hashedPassword;
        await user.save();
        console.log(`- Đã cập nhật role/password cho tài khoản: ${acc.email}`);
      }
    }

    // 3. Liệt kê danh sách tài khoản hiện có để kiểm tra
    const allUsers = await User.findAll({
      attributes: ['email', 'role', 'fullName']
    });

    console.log('\n--- Danh sách tài khoản hiện tại ---');
    console.table(allUsers.map(u => ({
      Email: u.email,
      Role: u.role,
      'Họ tên': u.fullName,
      'Mật khẩu': '123456'
    })));

    console.log('\n--- Hoàn tất thành công ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi thực hiện fix-accounts:', error);
    process.exit(1);
  }
}

fixAccounts();
