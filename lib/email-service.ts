import pool from './database';
import { IMAPClient, EmailData, IMAPConfig } from './imap';

export interface DuplicateEmail {
  id: number;
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  folderName: string;
  mailboxId: string;
  uid: number;
  size: number;
  duplicateCount: number;
  duplicates: DuplicateEmail[];
}

export class EmailService {
  static async saveEmails(emails: EmailData[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const email of emails) {
        await client.query(`
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
        `, [
          email.messageId,
          email.subject,
          email.from,
          email.to,
          email.date,
          email.folderName,
          email.mailboxId,
          email.contentHash,
          email.uid,
          email.size
        ]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findDuplicates(mailboxId?: string): Promise<DuplicateEmail[]> {
    const client = await pool.connect();
    try {
      let query = `
        WITH duplicate_groups AS (
          SELECT 
            content_hash,
            COUNT(*) as duplicate_count
          FROM emails
          ${mailboxId ? 'WHERE mailbox_id = $1' : ''}
          GROUP BY content_hash
          HAVING COUNT(*) > 1
        )
        SELECT 
          e.id,
          e.message_id,
          e.subject,
          e.from_address,
          e.to_address,
          e.date,
          e.folder_name,
          e.mailbox_id,
          e.uid,
          e.size,
          e.content_hash,
          dg.duplicate_count
        FROM emails e
        JOIN duplicate_groups dg ON e.content_hash = dg.content_hash
        ${mailboxId ? 'WHERE e.mailbox_id = $1' : ''}
        ORDER BY e.content_hash, e.date DESC
      `;

      const result = await client.query(query, mailboxId ? [mailboxId] : []);
      
      // Group duplicates by content_hash
      const duplicatesMap = new Map<string, DuplicateEmail[]>();
      
      for (const row of result.rows) {
        const contentHash = row.content_hash;
        if (!duplicatesMap.has(contentHash)) {
          duplicatesMap.set(contentHash, []);
        }
        
        duplicatesMap.get(contentHash)!.push({
          id: row.id,
          messageId: row.message_id,
          subject: row.subject,
          from: row.from_address,
          to: row.to_address,
          date: row.date,
          folderName: row.folder_name,
          mailboxId: row.mailbox_id,
          uid: row.uid,
          size: row.size,
          duplicateCount: row.duplicate_count,
          duplicates: []
        });
      }

      // Convert to array and add duplicates array
      const duplicates: DuplicateEmail[] = [];
      for (const [contentHash, emails] of Array.from(duplicatesMap.entries())) {
        const firstEmail = emails[0];
        firstEmail.duplicates = emails;
        duplicates.push(firstEmail);
      }

      return duplicates;
    } finally {
      client.release();
    }
  }

  static async findCrossMailboxDuplicates(mailbox1Id: string, mailbox2Id: string): Promise<DuplicateEmail[]> {
    const client = await pool.connect();
    try {
      const query = `
        WITH mailbox1_emails AS (
          SELECT content_hash, COUNT(*) as count1
          FROM emails
          WHERE mailbox_id = $1
          GROUP BY content_hash
        ),
        mailbox2_emails AS (
          SELECT content_hash, COUNT(*) as count2
          FROM emails
          WHERE mailbox_id = $2
          GROUP BY content_hash
        ),
        cross_duplicates AS (
          SELECT 
            m1.content_hash,
            m1.count1 + m2.count2 as total_count
          FROM mailbox1_emails m1
          JOIN mailbox2_emails m2 ON m1.content_hash = m2.content_hash
        )
        SELECT 
          e.id,
          e.message_id,
          e.subject,
          e.from_address,
          e.to_address,
          e.date,
          e.folder_name,
          e.mailbox_id,
          e.uid,
          e.size,
          e.content_hash,
          cd.total_count as duplicate_count
        FROM emails e
        JOIN cross_duplicates cd ON e.content_hash = cd.content_hash
        WHERE e.mailbox_id IN ($1, $2)
        ORDER BY e.content_hash, e.date DESC
      `;

      const result = await client.query(query, [mailbox1Id, mailbox2Id]);
      
      // Group duplicates by content_hash
      const duplicatesMap = new Map<string, DuplicateEmail[]>();
      
      for (const row of result.rows) {
        const contentHash = row.content_hash;
        if (!duplicatesMap.has(contentHash)) {
          duplicatesMap.set(contentHash, []);
        }
        
        duplicatesMap.get(contentHash)!.push({
          id: row.id,
          messageId: row.message_id,
          subject: row.subject,
          from: row.from_address,
          to: row.to_address,
          date: row.date,
          folderName: row.folder_name,
          mailboxId: row.mailbox_id,
          uid: row.uid,
          size: row.size,
          duplicateCount: row.duplicate_count,
          duplicates: []
        });
      }

      // Convert to array and add duplicates array
      const duplicates: DuplicateEmail[] = [];
      for (const [contentHash, emails] of Array.from(duplicatesMap.entries())) {
        const firstEmail = emails[0];
        firstEmail.duplicates = emails;
        duplicates.push(firstEmail);
      }

      return duplicates;
    } finally {
      client.release();
    }
  }

  static async deleteEmail(id: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM emails WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  static async deleteEmails(ids: number[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM emails WHERE id = ANY($1)', [ids]);
    } finally {
      client.release();
    }
  }

  static async scanMailbox(config: IMAPConfig, mailboxId: string): Promise<EmailData[]> {
    const client = new IMAPClient(config);
    await client.connect();
    
    try {
      const folders = await client.getFolders();
      const allEmails: EmailData[] = [];
      
      for (const folder of folders) {
        try {
          const emails = await client.getEmailsFromFolder(folder, mailboxId);
          allEmails.push(...emails);
        } catch (error) {
          console.error(`Error scanning folder ${folder}:`, error);
        }
      }
      
      return allEmails;
    } finally {
      client.disconnect();
    }
  }
}
