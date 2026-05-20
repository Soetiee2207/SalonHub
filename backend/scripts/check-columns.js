const mysql = require('mysql2/promise');

const check = async () => {
  const configs = [
    { host: '127.0.0.1', user: 'root', password: '', database: 'salonhub' },
    { host: '127.0.0.1', user: 'root', password: 'root', database: 'salonhub' },
    { host: '127.0.0.1', user: 'root', password: '', database: 'salon_hub' },
    { host: '127.0.0.1', user: 'root', password: 'root', database: 'salon_hub' },
  ];

  for (const config of configs) {
    try {
      console.log(`Trying connection to ${config.database} with password: "${config.password}"...`);
      const connection = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database
      });
      console.log('✅ Connected successfully!');
      const [rows] = await connection.execute('DESCRIBE cash_flow_transactions');
      console.log('Columns:');
      console.log(JSON.stringify(rows, null, 2));
      await connection.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  process.exit(1);
};

check();
