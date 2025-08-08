import Imap from 'imap';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';

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

  constructor(config: IMAPConfig) {
    this.imap = new Imap({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      tls: config.secure,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => resolve());
      this.imap.once('error', (err) => reject(err));
      this.imap.connect();
    });
  }

  async getFolders(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }

        const folders: string[] = [];
        const traverse = (box: any, prefix = '') => {
          const name = prefix + box.name;
          folders.push(name);
          if (box.children) {
            box.children.forEach((child: any) => traverse(child, name + '/'));
          }
        };

        Object.values(boxes).forEach(box => traverse(box));
        resolve(folders);
      });
    });
  }

  async getEmailsFromFolder(folderName: string, mailboxId: string): Promise<EmailData[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folderName, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const emails: EmailData[] = [];
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
                from: parsed.from?.text || '',
                to: parsed.to?.text || '',
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
          reject(err);
        });

        fetch.once('end', () => {
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

  private generateContentHash(parsed: any): string {
    const content = `${parsed.subject || ''}${parsed.from?.text || ''}${parsed.to?.text || ''}${parsed.text || ''}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  disconnect(): void {
    this.imap.end();
  }
}
