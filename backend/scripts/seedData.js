require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

async function seed() {
  try {
    await db.sequelize.sync({ alter: true }); 
    console.log('Database schema updated (alter: true).');

    const hash = await bcrypt.hash('123456', 10);

    // === USERS ===
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

    // === BRANCHES (real TPHCM addresses) ===
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

    // Assign staff to branches
    await staff1.update({ branchId: branch1.id });
    await staff2.update({ branchId: branch1.id });
    await staff3.update({ branchId: branch2.id });

    console.log('Branches seeded.');

    // === SERVICE CATEGORIES ===
    const catCat = await db.ServiceCategory.create({ name: 'Cắt tóc', description: 'Các dịch vụ cắt tóc nam nữ' });
    const catUon = await db.ServiceCategory.create({ name: 'Uốn tóc', description: 'Các dịch vụ uốn tóc chuyên nghiệp' });
    const catNhuom = await db.ServiceCategory.create({ name: 'Nhuộm tóc', description: 'Nhuộm tóc thời trang và phủ bạc' });
    const catPhuchoi = await db.ServiceCategory.create({ name: 'Phục hồi & Dưỡng', description: 'Phục hồi tóc hư tổn, dưỡng tóc sâu' });
    const catGoi = await db.ServiceCategory.create({ name: 'Gội & Massage', description: 'Gội đầu thư giãn kết hợp massage' });

    console.log('Service categories seeded.');

    // === SERVICES (real prices VND) ===
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

    // === PRODUCT CATEGORIES ===
    const pcatSap = await db.ProductCategory.create({ name: 'Sáp vuốt tóc', description: 'Các loại sáp, wax tạo kiểu tóc' });
    const pcatDaugoi = await db.ProductCategory.create({ name: 'Dầu gội & Dầu xả', description: 'Dầu gội đầu và dầu xả chăm sóc tóc' });
    const pcatDuong = await db.ProductCategory.create({ name: 'Dưỡng tóc', description: 'Serum, tinh dầu, xịt dưỡng tóc' });
    const pcatDungcu = await db.ProductCategory.create({ name: 'Dụng cụ tạo kiểu', description: 'Máy sấy, máy uốn, lược chải tóc' });

    console.log('Product categories seeded.');

    // === PRODUCTS (real products, real prices VND) ===
    await db.Product.create({ name: 'Sáp vuốt tóc Osis+ Mess Up', description: 'Sáp vuốt tóc Schwarzkopf Osis+ Mess Up tạo kiểu matte finish, giữ nếp trung bình. Phù hợp tóc ngắn và trung bình.', price: 350000, stock: 50, categoryId: pcatSap.id, isActive: true, image: 'https://www.planetbeauty.com/cdn/shop/files/Schwarzkopf_Professional_Osis_Mess_Up__4.jpg?v=1711485143' });
    await db.Product.create({ name: 'Sáp By Vilain Gold Digger', description: 'Sáp vuốt tóc By Vilain Gold Digger giữ nếp mạnh, matte finish tự nhiên. Hương thơm nam tính.', price: 420000, stock: 35, categoryId: pcatSap.id, isActive: true, image: 'https://sgpomades.com/cdn/shop/files/By-Vilain-Gold-Digger-65ml-SGPomades-Discover-Joy-in-Self-Care-6677.jpg?v=1716970597' });
    await db.Product.create({ name: 'Pomade Reuzel Blue', description: 'Pomade gốc nước Reuzel Blue Strong Hold, bóng vừa, dễ gội sạch. Hương vanilla cola.', price: 380000, stock: 40, categoryId: pcatSap.id, isActive: true, image: 'https://ishampoos.com/cdn/shop/files/reuzel-blue-pomade-strong-hold-water-soluble-113g4oz-852578006010.jpg?v=1773416233' });
    await db.Product.create({ name: 'Clay Baxter of California', description: 'Sáp clay Baxter of California tạo kiểu matte, giữ nếp mạnh, phù hợp tóc dày.', price: 550000, stock: 25, categoryId: pcatSap.id, isActive: true, image: 'https://www.apothecarie.com/cdn/shop/products/302-45834_7314a050-ba3a-4137-b488-b4d6122905a9.jpg?v=1662486112' });
    await db.Product.create({ name: 'Wax Gatsby Moving Rubber', description: 'Gatsby Moving Rubber Spiky Edge, giữ nếp cứng, tạo kiểu tóc gai dễ dàng.', price: 95000, stock: 100, categoryId: pcatSap.id, isActive: true, image: 'https://japanesetaste.com/cdn/shop/files/P-1-MND-WAX-SP-80-Mandom_Gatsby_Moving_Rubber_Hair_Wax_Spiky_Edge_80g_450x450.jpg?v=1743424944' });

    await db.Product.create({ name: 'Dầu gội TRESemmé Keratin Smooth', description: 'Dầu gội TRESemmé Keratin Smooth giúp tóc suôn mượt, giảm xơ rối, chai 640ml.', price: 155000, stock: 60, categoryId: pcatDaugoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=600&fit=crop' });
    await db.Product.create({ name: 'Dầu gội Head & Shoulders', description: 'Dầu gội Head & Shoulders sạch gàu, mát lạnh bạc hà, chai 625ml.', price: 135000, stock: 80, categoryId: pcatDaugoi.id, isActive: true, image: 'https://www.herbsdaily.com/cdn/shop/files/98316_a30e85f2-30aa-4711-9a82-07385c469c23.jpg?v=1751322089' });
    await db.Product.create({ name: 'Dầu gội Moroccanoil', description: 'Dầu gội Moroccanoil Moisture Repair cho tóc hư tổn, chiết xuất dầu Argan, chai 250ml.', price: 520000, stock: 20, categoryId: pcatDaugoi.id, isActive: true, image: 'https://www.imagebeauty.com/cdn/shop/products/image-4.jpg?v=1642114070' });
    await db.Product.create({ name: 'Dầu xả Dove Phục Hồi Hư Tổn', description: 'Dầu xả Dove Intensive Repair phục hồi tóc hư tổn, chai 620ml.', price: 115000, stock: 70, categoryId: pcatDaugoi.id, isActive: true, image: 'https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=600&h=600&fit=crop' });

    await db.Product.create({ name: 'Serum dưỡng tóc Moroccanoil Treatment', description: 'Tinh dầu dưỡng tóc Moroccanoil Original Treatment, giúp tóc bóng mượt, giảm xơ, 100ml.', price: 780000, stock: 15, categoryId: pcatDuong.id, isActive: true, image: 'https://livelovespa.com/cdn/shop/files/Untitleddesign-2023-08-17T161533.454.png?v=1692314178' });
    await db.Product.create({ name: 'Xịt dưỡng tóc Mise en Scene', description: 'Xịt dưỡng tóc Mise en Scene Perfect Serum Mist, dưỡng ẩm không gây bết, 150ml.', price: 165000, stock: 45, categoryId: pcatDuong.id, isActive: true, image: 'https://www.masksheets.com/cdn/shop/files/newitem-2025-11-11T120533.889.png?v=1762881026' });
    await db.Product.create({ name: 'Tinh dầu Argan L\'Oréal', description: 'Tinh dầu dưỡng tóc L\'Oréal Extraordinary Oil chiết xuất Argan, 100ml.', price: 220000, stock: 30, categoryId: pcatDuong.id, isActive: true, image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=600&fit=crop' });

    await db.Product.create({ name: 'Máy sấy tóc Panasonic EH-ND65', description: 'Máy sấy tóc Panasonic 2000W, 3 chế độ nhiệt, ion dưỡng tóc.', price: 650000, stock: 15, categoryId: pcatDungcu.id, isActive: true, image: 'https://www.esh2u.com/cdn/shop/files/2_d6a358d6-7fe3-4b6c-8c23-cdce405d2f09.png?v=1730880811' });
    await db.Product.create({ name: 'Máy uốn tóc Philips BHB862', description: 'Máy uốn tóc Philips StyleCare, thanh uốn 25mm, lớp phủ Ceramic.', price: 490000, stock: 10, categoryId: pcatDungcu.id, isActive: true, image: 'https://gandhiappliances.com/cdn/shop/products/eh-na-65-k_1024x.jpg?v=1608492995' });
    await db.Product.create({ name: 'Lược chải tóc Tangle Teezer', description: 'Lược gỡ rối Tangle Teezer Original, chải tóc không đau, phù hợp mọi loại tóc.', price: 280000, stock: 40, categoryId: pcatDungcu.id, isActive: true, image: 'https://us.tangleteezer.com/cdn/shop/files/PinkFizz_OR_PDP_1.png?v=1762110971' });

    console.log('Products seeded.');

    // === STAFF SKILLS ===
    // Tuấn: cắt nam, uốn nam, gội
    await db.StaffSkill.bulkCreate([
      { userId: staff1.id, serviceId: svc1.id },
      { userId: staff1.id, serviceId: svc2.id },
      { userId: staff1.id, serviceId: svc5.id },
      { userId: staff1.id, serviceId: svc13.id },
    ]);
    // Nam: cắt nam/nữ, nhuộm, phục hồi
    await db.StaffSkill.bulkCreate([
      { userId: staff2.id, serviceId: svc1.id },
      { userId: staff2.id, serviceId: svc3.id },
      { userId: staff2.id, serviceId: svc8.id },
      { userId: staff2.id, serviceId: svc9.id },
      { userId: staff2.id, serviceId: svc10.id },
    ]);
    // Mai: cắt nữ, uốn nữ, nhuộm, dưỡng, gội
    await db.StaffSkill.bulkCreate([
      { userId: staff3.id, serviceId: svc3.id },
      { userId: staff3.id, serviceId: svc4.id },
      { userId: staff3.id, serviceId: svc6.id },
      { userId: staff3.id, serviceId: svc7.id },
      { userId: staff3.id, serviceId: svc8.id },
      { userId: staff3.id, serviceId: svc11.id },
      { userId: staff3.id, serviceId: svc12.id },
      { userId: staff3.id, serviceId: svc14.id },
    ]);

    console.log('Staff skills seeded.');

    // === STAFF SCHEDULES (Mon-Sat) ===
    const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri
    for (const day of weekdays) {
      await db.StaffSchedule.create({ userId: staff1.id, branchId: branch1.id, dayOfWeek: day, startTime: '08:00', endTime: '17:00' });
      await db.StaffSchedule.create({ userId: staff2.id, branchId: branch1.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00' });
      await db.StaffSchedule.create({ userId: staff3.id, branchId: branch2.id, dayOfWeek: day, startTime: '08:30', endTime: '17:30' });
    }
    // Saturday
    await db.StaffSchedule.create({ userId: staff1.id, branchId: branch1.id, dayOfWeek: 6, startTime: '08:00', endTime: '14:00' });
    await db.StaffSchedule.create({ userId: staff2.id, branchId: branch1.id, dayOfWeek: 6, startTime: '09:00', endTime: '15:00' });
    await db.StaffSchedule.create({ userId: staff3.id, branchId: branch2.id, dayOfWeek: 6, startTime: '08:30', endTime: '14:30' });

    console.log('Staff schedules seeded.');

    // === VOUCHERS ===
    await db.Voucher.create({ code: 'CHAOBAN', discount: 20, discountType: 'percent', minOrderValue: 200000, maxDiscount: 100000, startDate: '2026-01-01', endDate: '2026-12-31', usageLimit: 500, usedCount: 0, isActive: true });
    await db.Voucher.create({ code: 'GIAM50K', discount: 50000, discountType: 'fixed', minOrderValue: 300000, maxDiscount: 50000, startDate: '2026-01-01', endDate: '2026-06-30', usageLimit: 200, usedCount: 0, isActive: true });
    await db.Voucher.create({ code: 'SUMMER30', discount: 30, discountType: 'percent', minOrderValue: 500000, maxDiscount: 200000, startDate: '2026-06-01', endDate: '2026-08-31', usageLimit: 100, usedCount: 0, isActive: true });
    await db.Voucher.create({ code: 'FREESHIP', discount: 30000, discountType: 'fixed', minOrderValue: 0, maxDiscount: 30000, startDate: '2026-01-01', endDate: '2026-12-31', usageLimit: 1000, usedCount: 0, isActive: true });

    console.log('Vouchers seeded.');

    // === SAMPLE APPOINTMENTS ===
    await db.Appointment.create({ userId: customer1.id, staffId: staff1.id, branchId: branch1.id, serviceId: svc1.id, date: '2026-03-10', startTime: '09:00', endTime: '09:30', status: 'completed', totalPrice: 80000, note: 'Cắt ngắn gọn gàng' });
    await db.Appointment.create({ userId: customer1.id, staffId: staff1.id, branchId: branch1.id, serviceId: svc5.id, date: '2026-03-12', startTime: '14:00', endTime: '15:30', status: 'completed', totalPrice: 350000, note: 'Uốn kiểu Hàn Quốc' });
    await db.Appointment.create({ userId: customer2.id, staffId: staff3.id, branchId: branch2.id, serviceId: svc6.id, date: '2026-03-14', startTime: '10:00', endTime: '12:00', status: 'confirmed', totalPrice: 500000 });
    await db.Appointment.create({ userId: customer3.id, staffId: staff2.id, branchId: branch1.id, serviceId: svc8.id, date: '2026-03-15', startTime: '09:00', endTime: '10:30', status: 'pending', totalPrice: 400000, note: 'Nhuộm nâu vàng' });
    await db.Appointment.create({ userId: customer2.id, staffId: staff3.id, branchId: branch2.id, serviceId: svc14.id, date: '2026-03-16', startTime: '15:00', endTime: '15:45', status: 'pending', totalPrice: 150000 });

    console.log('Appointments seeded.');

    // === SAMPLE REVIEWS ===
    await db.Review.create({ userId: customer1.id, staffId: staff1.id, appointmentId: 1, rating: 5, comment: 'Anh Tuấn cắt rất đẹp, đúng ý mình. Sẽ quay lại!' });
    await db.Review.create({ userId: customer1.id, staffId: staff1.id, appointmentId: 2, rating: 4, comment: 'Uốn đẹp lắm, hơi lâu một chút nhưng kết quả rất ưng.' });

    console.log('Reviews seeded.');

    // === SAMPLE ORDERS ===
    const order1 = await db.Order.create({ userId: customer1.id, totalAmount: 730000, status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid', address: '56 Lý Tự Trọng, Quận 1, TP.HCM', phone: '0912345678', discountAmount: 0 });
    await db.OrderItem.create({ orderId: order1.id, productId: 1, quantity: 1, price: 350000 });
    await db.OrderItem.create({ orderId: order1.id, productId: 3, quantity: 1, price: 380000 });

    const order2 = await db.Order.create({ userId: customer2.id, totalAmount: 270000, status: 'confirmed', paymentMethod: 'vnpay', paymentStatus: 'paid', address: '120 Pasteur, Quận 3, TP.HCM', phone: '0912345679', discountAmount: 0 });
    await db.OrderItem.create({ orderId: order2.id, productId: 6, quantity: 1, price: 155000 });
    await db.OrderItem.create({ orderId: order2.id, productId: 9, quantity: 1, price: 115000 });

    const order3 = await db.Order.create({ userId: customer3.id, totalAmount: 845000, status: 'pending', paymentMethod: 'cod', paymentStatus: 'pending', address: '88 Nguyễn Thị Thập, Quận 7, TP.HCM', phone: '0912345680', discountAmount: 100000, voucherId: 1 });
    await db.OrderItem.create({ orderId: order3.id, productId: 4, quantity: 1, price: 550000 });
    await db.OrderItem.create({ orderId: order3.id, productId: 11, quantity: 2, price: 165000 });

    console.log('Orders seeded.');

    // === SAMPLE PRODUCT REVIEWS ===
    await db.ProductReview.create({ userId: customer1.id, productId: 1, rating: 5, comment: 'Sáp Osis+ rất tốt, giữ nếp cả ngày, mùi thơm nhẹ.' });
    await db.ProductReview.create({ userId: customer1.id, productId: 3, rating: 4, comment: 'Pomade Reuzel Blue bóng đẹp, dễ gội sạch. Mùi hơi nồng.' });
    await db.ProductReview.create({ userId: customer2.id, productId: 6, rating: 5, comment: 'Dầu gội TRESemmé rất mượt, mùi thơm dịu. Dùng hoài không chán.' });
    await db.ProductReview.create({ userId: customer3.id, productId: 4, rating: 4, comment: 'Clay Baxter giữ nếp tốt nhưng hơi khó gội sạch.' });

    console.log('Product reviews seeded.');

    // === SAMPLE PAYMENTS ===
    await db.Payment.create({ orderId: order1.id, amount: 730000, method: 'cod', status: 'success', transactionId: null });
    await db.Payment.create({ orderId: order2.id, amount: 270000, method: 'vnpay', status: 'success', transactionId: 'VNP14082726' });

    console.log('Payments seeded.');

    // === SAMPLE NOTIFICATIONS ===
    await db.Notification.create({ userId: customer1.id, title: 'Đặt lịch thành công', message: 'Bạn đã đặt lịch cắt tóc nam cơ bản vào ngày 10/03/2026 lúc 09:00.', type: 'appointment', isRead: true });
    await db.Notification.create({ userId: customer1.id, title: 'Đơn hàng đã giao', message: 'Đơn hàng #1 của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!', type: 'order', isRead: true });
    await db.Notification.create({ userId: customer2.id, title: 'Lịch hẹn được xác nhận', message: 'Lịch hẹn uốn tóc nữ ngày 14/03/2026 đã được xác nhận. Hẹn gặp bạn!', type: 'appointment', isRead: false });
    await db.Notification.create({ userId: customer3.id, title: 'Khuyến mãi đặc biệt', message: 'Sử dụng mã CHAOBAN để được giảm 20% cho đơn hàng tiếp theo!', type: 'promotion', isRead: false });
    await db.Notification.create({ userId: customer1.id, title: 'Ưu đãi mùa hè', message: 'Mã SUMMER30 giảm 30% cho đơn từ 500.000đ. Áp dụng từ 01/06 đến 31/08/2026.', type: 'promotion', isRead: false });

    console.log('Notifications seeded.');

    console.log('\n=== SEED DATA COMPLETE ===');
    console.log('All data has been seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
