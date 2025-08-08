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

async function testEmailService() {
  console.log('🔍 Testing Email Service...');
  
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
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test inserting a sample email
    console.log('\n📧 Testing email insertion...');
    const sampleEmail = {
      messageId: 'test-message-123',
      subject: 'Test Email',
      from: 'test@example.com',
      to: 'recipient@example.com',
      date: new Date(),
      folderName: 'INBOX',
      mailboxId: 'test-mailbox',
      contentHash: 'test-hash-123',
      uid: 1,
      size: 1024
    };
    
    const insertResult = await client.query(`
      INSERT INTO emails (message_id, subject, from_address, to_address, date, folder_name, mailbox_id, content_hash, uid, size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (message_id) DO UPDATE SET
        subject = EXCLUDED.subject,
        from_address = EXCLUDED.from_address,
        to_address = EXCLUDED.to_address,
        date = EXCLUDED.date,
        folder_name = EXCLUDED.folder_name,
        mailbox_id = EXCLUDED.mailbox_id,
        content_hash = EXCLUDED.content_hash,
        uid = EXCLUDED.uid,
        size = EXCLUDED.size
      RETURNING id
    `, [
      sampleEmail.messageId,
      sampleEmail.subject,
      sampleEmail.from,
      sampleEmail.to,
      sampleEmail.date,
      sampleEmail.folderName,
      sampleEmail.mailboxId,
      sampleEmail.contentHash,
      sampleEmail.uid,
      sampleEmail.size
    ]);
    
    console.log(`✅ Sample email inserted with ID: ${insertResult.rows[0].id}`);
    
    // Test retrieving the email
    console.log('\n📖 Testing email retrieval...');
    const retrieveResult = await client.query('SELECT * FROM emails WHERE message_id = $1', [sampleEmail.messageId]);
    
    if (retrieveResult.rows.length > 0) {
      console.log('✅ Email retrieved successfully:');
      console.log(`   - Subject: ${retrieveResult.rows[0].subject}`);
      console.log(`   - From: ${retrieveResult.rows[0].from_address}`);
      console.log(`   - To: ${retrieveResult.rows[0].to_address}`);
      console.log(`   - Folder: ${retrieveResult.rows[0].folder_name}`);
      console.log(`   - Mailbox: ${retrieveResult.rows[0].mailbox_id}`);
    } else {
      console.log('❌ Failed to retrieve email');
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await client.query('DELETE FROM emails WHERE message_id = $1', [sampleEmail.messageId]);
    console.log('✅ Test data cleaned up');
    
    client.release();
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testEmailService();
