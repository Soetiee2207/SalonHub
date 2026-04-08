const bcrypt = require('bcryptjs');
const db = require('../models');

const wipeData = async () => {
    console.log('🚀 Starting TOTAL RECOVERY WIPE...');
    
    try {
        // 1. Sync schema FIRST to ensure model-DB alignment (ensures loyaltyPoints, rank exist)
        console.log('🔄 Synchronizing database schema (alter: true)...');
        await db.sequelize.sync({ alter: true });
        
        // 2. Disable FK checks
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // 3. WIPE ALL target tables
        // Note: We keep products, branches, services, and categories as requested.
        const tables = [
            'order_items', 'payments', 'product_reviews', 'reviews', 'notifications', 
            'carts', 'addresses', 'inventory_transactions', 'orders', 'appointments', 
            'vouchers', 'staff_skills', 'staff_schedules', 'users'
        ];
        
        for (const table of tables) {
            console.log(`🗑  Wiping table: ${table}...`);
            // Sequential delete to handle potential index issues during wipe
            await db.sequelize.query(`DELETE FROM ${table}`);
            try {
                await db.sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
            } catch (e) {
               console.log(`ℹ️  Could not reset auto-increment for ${table} (Ignored)`);
            }
        }
        
        // 4. Re-enable FK checks
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // 5. Create new Admin
        console.log('👤 Recreating primary Administrator account...');
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        await db.User.create({
            fullName: 'System Administrator',
            email: 'admin@salonhub.vn',
            password: hashedPassword,
            role: 'admin',
            phone: '0900000000',
            loyaltyPoints: 0,
            rank: 'Silver'
        });
        
        console.log('✅ DATABASE RESET COMPLETED SUCCESSFULLY.');
        console.log('👉 New Admin: admin@salonhub.vn / 123456');
        process.exit(0);
    } catch (error) {
        console.error('❌ FATAL ERROR DURING RESET:');
        // Detailed error reporting to root cause any remaining issues
        console.dir(error, { depth: null });
        process.exit(1);
    }
};

wipeData();
