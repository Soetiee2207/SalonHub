require('dotenv').config({ override: true });
const db = require('../models');

async function migrate() {
  try {
    console.log('Starting deposit migration...');
    
    // 1. Update appointments status ENUM
    await db.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status ENUM('awaiting_deposit','pending','confirmed','in_progress','completed','cancelled') 
      DEFAULT 'awaiting_deposit'
    `);
    console.log('✅ Updated appointments.status ENUM');
    
    // 2. Add depositAmount column
    try {
      await db.sequelize.query(`
        ALTER TABLE appointments ADD COLUMN depositAmount DECIMAL(10,2) DEFAULT NULL
      `);
      console.log('✅ Added appointments.depositAmount');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('⏭️  appointments.depositAmount already exists');
      } else throw e;
    }
    
    // 3. Add depositStatus column
    try {
      await db.sequelize.query(`
        ALTER TABLE appointments ADD COLUMN depositStatus ENUM('pending','paid','refunded') DEFAULT 'pending'
      `);
      console.log('✅ Added appointments.depositStatus');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('⏭️  appointments.depositStatus already exists');
      } else throw e;
    }
    
    // 4. Update cash_flow_transactions category ENUM
    await db.sequelize.query(`
      ALTER TABLE cash_flow_transactions 
      MODIFY COLUMN category ENUM('utilities','rent','salary','supplier_payment','outside_income','refund','deposit','other') 
      NOT NULL
    `);
    console.log('✅ Updated cash_flow_transactions.category ENUM');
    
    console.log('\n🎉 All deposit migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
