require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

async function seed() {
  try {
    await db.sequelize.sync({ alter: true }); 
    console.log('Database schema updated (alter: true).');

    const hash = await bcrypt.hash('123456', 10);

    const admin = await db.User.create({
      fullName: 'Nguyễn Văn Admin',
      email: 'admin@salonhub.vn',
      password: hash,
      phone: '0901000001',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    });

    const staff1 = await db.User.create({
      fullName: 'Trần Minh Tuấn',
      email: 'tuan@salonhub.vn',
      password: hash,
      phone: '0901000002',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
    });

    const staff2 = await db.User.create({
      fullName: 'Lê Hoàng Nam',
      email: 'nam@salonhub.vn',
      password: hash,
      phone: '0901000003',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face'
    });

    const staff3 = await db.User.create({
      fullName: 'Phạm Thị Mai',
      email: 'mai@salonhub.vn',
      password: hash,
      phone: '0901000004',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face'
    });

    const customer1 = await db.User.create({
      fullName: 'Võ Thanh Hùng',
      email: 'hung@gmail.com',
      password: hash,
      phone: '0912345678',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face'
    });

    const customer2 = await db.User.create({
      fullName: 'Nguyễn Thị Lan',
      email: 'lan@gmail.com',
      password: hash,
      phone: '0912345679',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face'
    });

    const customer3 = await db.User.create({
      fullName: 'Đặng Quốc Bảo',
      email: 'bao@gmail.com',
      password: hash,
      phone: '0912345680',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face'
    });

    console.log('Users seeded.');

    const branch1 = await db.Branch.create({
      name: 'SalonHub Quận 1',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      phone: '028 3821 1234',
      openTime: '08:00',
      closeTime: '21:00',
      image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=500&fit=crop'
    });

    const branch2 = await db.Branch.create({
      name: 'SalonHub Quận 3',
      address: '45 Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
      phone: '028 3930 5678',
      openTime: '08:30',
      closeTime: '21:30',
      image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=500&fit=crop'
    });

    const branch3 = await db.Branch.create({
      name: 'SalonHub Quận 7',
      address: '789 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP.HCM',
      phone: '028 5412 9876',
      openTime: '08:00',
      closeTime: '22:00',
      image: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&h=500&fit=crop'
    });

    await staff1.update({ branchId: branch1.id });
    await staff2.update({ branchId: branch1.id });
    await staff3.update({ branchId: branch2.id });

    console.log('Branches seeded.');

    const catCat = await db.ServiceCategory.create({ name: 'Cắt tóc', description: 'Các dịch vụ cắt tóc nam nữ' });
    const catUon = await db.ServiceCategory.create({ name: 'Uốn tóc', description: 'Các dịch vụ uốn tóc chuyên nghiệp' });
    const catNhuom = await db.ServiceCategory.create({ name: 'Nhuộm tóc', description: 'Nhuộm tóc thời trang và phủ bạc' });
    const catPhuchoi = await db.ServiceCategory.create({ name: 'Phục hồi & Dưỡng', description: 'Phục hồi tóc hư tổn, dưỡng tóc sâu' });
    const catGoi = await db.ServiceCategory.create({ name: 'Gội & Massage', description: 'Gội đầu thư giãn kết hợp massage' });

    console.log('Service categories seeded.');

    const svc1 = await db.Service.create({ name: 'Cắt tóc nam cơ bản', description: 'Cắt tóc nam theo yêu cầu, bao gồm gội và sấy tạo kiểu', price: 80000, duration: 30, categoryId: catCat.id, isActive: true, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop' });
    const svc2 = await db.Service.create({ name: 'Cắt tóc nam cao cấp', description: 'Cắt tóc nam với stylist chuyên nghiệp, tư vấn kiểu phù hợp khuôn mặt', price: 150000, duration: 45, categoryId: catCat.id, isActive: true, image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop' });
    const svc3 = await db.Service.create({ name: 'Cắt tóc nữ ngắn', description: 'Cắt tóc nữ ngắn thời trang, bao gồm gội sấy', price: 120000, duration: 40, categoryId: catCat.id, isActive: true, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' });
    const svc4 = await db.Service.create({ name: 'Cắt tóc nữ dài', description: 'Cắt tỉa, tạo kiểu tóc dài, bao gồm gội sấy tạo kiểu', price: 180000, duration: 60, categoryId: catCat.id, isActive: true, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop' });

    const svc5 = await db.Service.create({ name: 'Uốn tóc nam Hàn Quốc', description: 'Uốn tóc nam kiểu Hàn Quốc tự nhiên, giữ nếp lâu 3-6 tháng', price: 350000, duration: 90, categoryId: catUon.id, isActive: true, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop' });
    const svc6 = await db.Service.create({ name: 'Uốn tóc nữ lọn lớn', description: 'Uốn tóc nữ sóng lọn lớn bồng bềnh, sử dụng thuốc uốn cao cấp', price: 500000, duration: 120, categoryId: catUon.id, isActive: true, image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop' });
    const svc7 = await db.Service.create({ name: 'Uốn phồng chân tóc', description: 'Uốn phồng chân tóc tạo độ bồng tự nhiên', price: 300000, duration: 60, categoryId: catUon.id, isActive: true, image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop' });

    const svc8 = await db.Service.create({ name: 'Nhuộm tóc thời trang', description: 'Nhuộm tóc màu thời trang (nâu, vàng, đỏ, highlight...)', price: 400000, duration: 90, categoryId: catNhuom.id, isActive: true, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop' });
    const svc9 = await db.Service.create({ name: 'Nhuộm phủ bạc', description: 'Nhuộm tóc phủ bạc với màu tự nhiên, an toàn cho da đầu', price: 250000, duration: 60, categoryId: catNhuom.id, isActive: true, image: 'https://images.unsplash.com/photo-1560869713-bf165a3b2c81?w=800&h=600&fit=crop' });

    const svc10 = await db.Service.create({ name: 'Phục hồi tóc Keratin', description: 'Phục hồi tóc hư tổn bằng Keratin cao cấp, tóc mềm mượt tức thì', price: 600000, duration: 90, categoryId: catPhuchoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&h=600&fit=crop' });
    const svc11 = await db.Service.create({ name: 'Hấp dầu phục hồi', description: 'Hấp dầu dưỡng tóc sâu, phục hồi tóc khô xơ', price: 200000, duration: 45, categoryId: catPhuchoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&h=600&fit=crop' });
    const svc12 = await db.Service.create({ name: 'Ủ tóc Collagen', description: 'Ủ tóc Collagen giúp tóc chắc khỏe, bóng mượt từ gốc đến ngọn', price: 350000, duration: 60, categoryId: catPhuchoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&h=600&fit=crop' });

    const svc13 = await db.Service.create({ name: 'Gội đầu dưỡng sinh', description: 'Gội đầu kết hợp massage đầu cổ vai gáy thư giãn', price: 70000, duration: 30, categoryId: catGoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop' });
    const svc14 = await db.Service.create({ name: 'Gội massage combo', description: 'Gội đầu + massage đầu + massage mặt + đắp mặt nạ', price: 150000, duration: 45, categoryId: catGoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop' });

    console.log('Services seeded.');

    const pcatSap = await db.ProductCategory.create({ name: 'Sáp vuốt tóc', description: 'Các loại sáp, wax tạo kiểu tóc' });
    const pcatDaugoi = await db.ProductCategory.create({ name: 'Dầu gội & Dầu xả', description: 'Dầu gội đầu và dầu xả chăm sóc tóc' });
    const pcatDuong = await db.ProductCategory.create({ name: 'Dưỡng tóc', description: 'Serum, tinh dầu, xịt dưỡng tóc' });
    const pcatDungcu = await db.ProductCategory.create({ name: 'Dụng cụ tạo kiểu', description: 'Máy sấy, máy uốn, lược chải tóc' });

    console.log('Product categories seeded.');

    await db.Product.create({ name: 'Sáp vuốt tóc Osis+', description: 'Tạo kiểu matte finish, giữ nếp trung bình.', price: 350000, stock: 50, categoryId: pcatSap.id, isActive: true, image: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=600&h=600&fit=crop' });
    await db.Product.create({ name: 'Sáp By Vilain Gold Digger', description: 'Giữ nếp mạnh, matte finish tự nhiên.', price: 420000, stock: 35, categoryId: pcatSap.id, isActive: true, image: 'https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=600&h=600&fit=crop' });
    await db.Product.create({ name: 'Dầu gội TRESemmé Keratin Smooth', description: 'Giúp tóc suôn mượt, giảm xơ rối.', price: 155000, stock: 60, categoryId: pcatDaugoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=600&fit=crop' });
    await db.Product.create({ name: 'Serum dưỡng tóc Moroccanoil', description: 'Giúp tóc bóng mượt, giảm xơ.', price: 780000, stock: 15, categoryId: pcatDuong.id, isActive: true, image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=600&fit=crop' });

    console.log('Products seeded.');

    await db.StaffSkill.bulkCreate([
      { userId: staff1.id, serviceId: svc1.id },
      { userId: staff1.id, serviceId: svc2.id },
      { userId: staff1.id, serviceId: svc5.id },
      { userId: staff1.id, serviceId: svc13.id },
    ]);
    await db.StaffSkill.bulkCreate([
      { userId: staff2.id, serviceId: svc1.id },
      { userId: staff2.id, serviceId: svc3.id },
      { userId: staff2.id, serviceId: svc8.id },
    ]);
    await db.StaffSkill.bulkCreate([
      { userId: staff3.id, serviceId: svc3.id },
      { userId: staff3.id, serviceId: svc4.id },
      { userId: staff3.id, serviceId: svc6.id },
    ]);

    console.log('Staff skills seeded.');

    const weekdays = [1, 2, 3, 4, 5];
    for (const day of weekdays) {
      await db.StaffSchedule.create({ userId: staff1.id, branchId: branch1.id, dayOfWeek: day, startTime: '08:00', endTime: '17:00' });
      await db.StaffSchedule.create({ userId: staff2.id, branchId: branch1.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00' });
      await db.StaffSchedule.create({ userId: staff3.id, branchId: branch2.id, dayOfWeek: day, startTime: '08:30', endTime: '17:30' });
    }

    console.log('Staff schedules seeded.');

    await db.Voucher.create({ code: 'CHAOBAN', discount: 20, discountType: 'percent', minOrderValue: 200000, maxDiscount: 100000, startDate: '2026-01-01', endDate: '2026-12-31', usageLimit: 500, usedCount: 0, isActive: true });

    console.log('Vouchers seeded.');

    await db.Appointment.create({ userId: customer1.id, staffId: staff1.id, branchId: branch1.id, serviceId: svc1.id, date: '2026-03-10', startTime: '09:00', endTime: '09:30', status: 'completed', totalPrice: 80000 });
    await db.Appointment.create({ userId: customer2.id, staffId: staff3.id, branchId: branch2.id, serviceId: svc6.id, date: '2026-03-14', startTime: '10:00', endTime: '12:00', status: 'confirmed', totalPrice: 500000 });

    console.log('Appointments seeded.');

    const order1 = await db.Order.create({ userId: customer1.id, totalAmount: 730000, status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid', address: '56 Lý Tự Trọng, Quận 1', phone: '0912345678', discountAmount: 0 });
    const order2 = await db.Order.create({ userId: customer2.id, totalAmount: 270000, status: 'confirmed', paymentMethod: 'sepay', paymentStatus: 'paid', address: '120 Pasteur, Quận 3', phone: '0912345679', discountAmount: 0 });

    console.log('Orders seeded.');

    await db.Payment.create({ orderId: order1.id, amount: 730000, method: 'cod', status: 'success' });
    await db.Payment.create({ orderId: order2.id, amount: 270000, method: 'sepay', status: 'success', transactionId: 'SP123456' });

    console.log('Payments seeded.');

    console.log('\n=== SEED DATA COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
