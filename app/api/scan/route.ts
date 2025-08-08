import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { IMAPConfig } from '@/lib/imap';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, user, password, secure, mailboxId } = body;

    if (!host || !port || !user || !password || !mailboxId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config: IMAPConfig = {
      host,
      port: parseInt(port),
      user,
      password,
      secure: Boolean(secure)
    };

    const emails = await EmailService.scanMailbox(config, mailboxId);
    await EmailService.saveEmails(emails);

    return NextResponse.json({
      success: true,
      message: `Scanned ${emails.length} emails from mailbox ${mailboxId}`,
      count: emails.length
    });
  } catch (error) {
    console.error('Error scanning mailbox:', error);
    return NextResponse.json(
      { error: 'Failed to scan mailbox', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
