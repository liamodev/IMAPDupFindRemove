const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  // Log environment variables (without sensitive data)
  console.log('📋 Environment variables:');
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 'not set'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'not set'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'not set'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[SET]' : 'not set'}`);
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'imap_duplicates',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_HOST?.includes('neon.tech') ? {
      rejectUnauthorized: false
    } : false,
  });

  try {
    console.log('\n🔌 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Current database time: ${result.rows[0].current_time}`);
    
    // Check if tables exist
    console.log('\n📊 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('emails', 'mailboxes')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found. Tables need to be created.');
      console.log('💡 Run the SQL script in your Neon SQL editor:');
      console.log('   - Copy the contents of scripts/init-database.sql');
      console.log('   - Paste it into your Neon SQL editor');
      console.log('   - Execute the script');
    } else {
      console.log('✅ Found tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
      // Check table structure
      for (const table of tablesResult.rows) {
        console.log(`\n📋 Table structure for ${table.table_name}:`);
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [table.table_name]);
        
        columnsResult.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
      
      // Check for data
      const emailsCount = await client.query('SELECT COUNT(*) as count FROM emails');
      const mailboxesCount = await client.query('SELECT COUNT(*) as count FROM mailboxes');
      
      console.log('\n📈 Data counts:');
      console.log(`   - emails: ${emailsCount.rows[0].count} records`);
      console.log(`   - mailboxes: ${mailboxesCount.rows[0].count} records`);
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env.local file has the correct database credentials');
    console.log('2. Verify the database exists and is accessible');
    console.log('3. Check if SSL is required for your database');
    console.log('4. Ensure the database user has the necessary permissions');
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
