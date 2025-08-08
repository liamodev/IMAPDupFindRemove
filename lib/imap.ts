import Imap from 'imap';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';
import { ProgressTracker, ProgressUpdate } from './progress-tracker';

export interface IMAPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
}

export interface EmailData {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  folderName: string;
  mailboxId: string;
  contentHash: string;
  uid: number;
  size: number;
}

export class IMAPClient {
  private imap: Imap;
  private progressTracker?: ProgressTracker;

  constructor(config: IMAPConfig, progressTracker?: ProgressTracker) {
    this.imap = new Imap({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      tls: config.secure,
      tlsOptions: { rejectUnauthorized: false }
    });
    this.progressTracker = progressTracker;
  }

  async connect(): Promise<void> {
    if (this.progressTracker) {
      // Access host from the constructor config instead of imap.config
      this.progressTracker.connecting('IMAP server');
    }
    
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => resolve());
      this.imap.once('error', (err: Error) => reject(err));
      this.imap.connect();
    });
  }

  async getFolders(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err: Error | null, boxes: any) => {
        if (err) {
          reject(err);
          return;
        }

        const folders: string[] = [];
        const traverse = (box: any, prefix = '') => {
          try {
            const name = prefix + (box.name || 'unknown');
            folders.push(name);
            
            // Handle children - check if it's an array or object
            if (box.children) {
              if (Array.isArray(box.children)) {
                box.children.forEach((child: any) => traverse(child, name + '/'));
              } else if (typeof box.children === 'object') {
                // Handle case where children might be an object instead of array
                Object.values(box.children).forEach((child: any) => traverse(child, name + '/'));
              }
            }
          } catch (error) {
            console.error('Error traversing folder:', error);
          }
        };

        try {
          Object.values(boxes).forEach(box => traverse(box));
        } catch (error) {
          console.error('Error processing boxes:', error);
          reject(error);
          return;
        }
        
        if (this.progressTracker) {
          this.progressTracker.foldersFound(folders.length);
        }
        
        resolve(folders);
      });
    });
  }

  async getEmailsFromFolder(folderName: string, mailboxId: string): Promise<EmailData[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folderName, false, (err, box) => {
        if (err) {
          console.error(`Error opening folder ${folderName}:`, err);
          reject(err);
          return;
        }

        const emails: EmailData[] = [];
        
        // Check if the box has messages
        if (!box.messages || box.messages.total === 0) {
          console.log(`No messages in folder ${folderName}`);
          resolve(emails);
          return;
        }

        const fetch = this.imap.seq.fetch('1:*', {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          let buffer = '';
          let uid: number;
          let size: number;

          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attrs) => {
            uid = attrs.uid;
            size = attrs.size;
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              const contentHash = this.generateContentHash(parsed);
              
              emails.push({
                messageId: parsed.messageId || `uid-${uid}-${Date.now()}`,
                subject: parsed.subject || '',
                from: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
                to: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
                date: parsed.date || new Date(),
                folderName,
                mailboxId,
                contentHash,
                uid: uid || 0,
                size: size || 0
              });
            } catch (error) {
              console.error('Error parsing email:', error);
            }
          });
        });

        fetch.once('error', (err) => {
          console.error(`Error fetching messages from folder ${folderName}:`, err);
          reject(err);
        });

        fetch.once('end', () => {
          console.log(`Fetched ${emails.length} emails from folder ${folderName}`);
          resolve(emails);
        });
      });
    });
  }

  async deleteEmail(folderName: string, uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folderName, false, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.imap.addFlags(uid, '\\Deleted', (err) => {
          if (err) {
            reject(err);
            return;
          }

          this.imap.expunge((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  async getFolderStructure(): Promise<{ name: string; emailCount: number; path: string }[]> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err: Error | null, boxes: any) => {
        if (err) {
          console.error('Error getting boxes:', err);
          reject(err);
          return;
        }

        console.log('Raw boxes structure:', Object.keys(boxes));
        console.log('Boxes object:', boxes);

        const folders: { name: string; emailCount: number; path: string }[] = [];
        
        const processBoxes = async () => {
          // First, try to test the connection by opening INBOX
          try {
            console.log('Testing connection by opening INBOX...');
            const inboxCount = await this.getEmailCount('INBOX');
            console.log(`INBOX has ${inboxCount} emails`);
            if (inboxCount > 0) {
              folders.push({ name: 'INBOX', emailCount: inboxCount, path: 'INBOX' });
            }
          } catch (error) {
            console.error('Error testing INBOX:', error);
          }

          const traverse = async (box: any, prefix = ''): Promise<void> => {
            try {
              console.log('Processing box:', box);
              // Skip boxes without a valid name
              if (!box.name || box.name === 'unknown' || box.name === '') {
                console.log('Skipping box with invalid name:', box.name);
                return;
              }
              
              const name = prefix + box.name;
              const path = name;
              console.log('Processing folder:', name);
              
              // Process all valid folder names (don't filter by email count yet)
              if (name && name.trim() !== '' && !name.includes('unknown')) {
                // Get email count for this folder
                const emailCount = await this.getEmailCount(name);
                console.log(`Folder ${name} has ${emailCount} emails`);
                // Add folder regardless of email count for now
                folders.push({ name, emailCount, path });
              }
              
              // Handle children - check if it's an array or object
              if (box.children) {
                console.log(`Folder ${name} has children:`, typeof box.children, Array.isArray(box.children));
                if (Array.isArray(box.children)) {
                  for (const child of box.children) {
                    await traverse(child, name + '.');
                  }
                } else if (typeof box.children === 'object') {
                  // Handle case where children might be an object instead of array
                  for (const child of Object.values(box.children)) {
                    await traverse(child as any, name + '.');
                  }
                }
              }
            } catch (error) {
              console.error('Error traversing folder:', error);
            }
          };

          try {
            console.log('Processing boxes:', Object.values(boxes));
            for (const box of Object.values(boxes)) {
              await traverse(box as any);
            }
            
            // Filter out any remaining invalid folders
            const validFolders = folders.filter(folder => 
              folder.name && 
              folder.name.trim() !== '' && 
              !folder.name.includes('unknown') && 
              !folder.name.startsWith('unknown/')
            );
            
            console.log('Final valid folders:', validFolders);
            
            // If no folders found, try common folder names with INBOX prefix
            if (validFolders.length === 0) {
              console.log('No folders found, trying common folder names with INBOX prefix...');
              const commonFolders = ['INBOX', 'INBOX.Sent', 'INBOX.Drafts', 'INBOX.Trash', 'INBOX.Junk', 'INBOX.spam'];
              
              for (const folderName of commonFolders) {
                try {
                  const emailCount = await this.getEmailCount(folderName);
                  if (emailCount > 0) {
                    console.log(`Found folder ${folderName} with ${emailCount} emails`);
                    validFolders.push({ name: folderName, emailCount, path: folderName });
                  }
                } catch (error) {
                  console.log(`Folder ${folderName} not accessible:`, error);
                }
              }
            }
            
            console.log('Final folders after fallback:', validFolders);
            resolve(validFolders);
          } catch (error) {
            console.error('Error processing folders:', error);
            reject(error);
          }
        };

        processBoxes();
      });
    });
  }

  private async getEmailCount(folderName: string): Promise<number> {
    return new Promise((resolve) => {
      // Skip invalid folder names
      if (!folderName || folderName.includes('unknown') || folderName.trim() === '') {
        console.log(`Skipping invalid folder for count: ${folderName}`);
        resolve(0);
        return;
      }

      console.log(`Getting email count for folder: ${folderName}`);
      this.imap.openBox(folderName, false, (err, box) => {
        if (err) {
          console.error(`Error opening folder ${folderName} for count:`, err);
          resolve(0);
          return;
        }

        // Return the total number of messages in the folder
        const count = box.messages ? box.messages.total : 0;
        console.log(`Folder ${folderName} has ${count} messages`);
        resolve(count);
      });
    });
  }

  private generateContentHash(parsed: any): string {
    const content = `${parsed.subject || ''}${parsed.from?.text || ''}${parsed.to?.text || ''}${parsed.text || ''}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  disconnect(): void {
    this.imap.end();
  }
}
