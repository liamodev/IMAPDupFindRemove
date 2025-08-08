import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'imap_duplicates',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export default pool;

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create emails table
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(255) UNIQUE,
        subject TEXT,
        from_address TEXT,
        to_address TEXT,
        date TIMESTAMP,
        folder_name VARCHAR(255),
        mailbox_id VARCHAR(255),
        content_hash VARCHAR(255),
        uid INTEGER,
        size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create mailboxes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mailboxes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        host VARCHAR(255),
        port INTEGER,
        username VARCHAR(255),
        secure BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
      CREATE INDEX IF NOT EXISTS idx_emails_content_hash ON emails(content_hash);
      CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder_name);
      CREATE INDEX IF NOT EXISTS idx_emails_mailbox ON emails(mailbox_id);
    `);

  } finally {
    client.release();
  }
}
