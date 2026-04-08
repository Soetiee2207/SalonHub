const bcrypt = require('bcryptjs');
const db = require('../models');

async function resetPasswords() {
  try {
    console.log('Starting password reset process...');
    
    const passwordToHash = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);
    
    console.log(`Generated hash for "${passwordToHash}": ${hashedPassword}`);
    
    const [updatedCount] = await db.User.update(
      { password: hashedPassword },
      { where: {} } // Update all users
    );
    
    console.log(`Successfully updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
}

resetPasswords();
