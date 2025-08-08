-- IMAP Duplicate Email Finder Database Schema
-- Run this script in your Neon SQL editor to initialize the database

-- Create emails table
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
);

-- Create mailboxes table
CREATE TABLE IF NOT EXISTS mailboxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    host VARCHAR(255),
    port INTEGER,
    username VARCHAR(255),
    secure BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_content_hash ON emails(content_hash);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder_name);
CREATE INDEX IF NOT EXISTS idx_emails_mailbox ON emails(mailbox_id);

-- Display confirmation
SELECT 'Database schema initialized successfully!' as status;
