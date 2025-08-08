import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { IMAPConfig } from '@/lib/imap';
import { ProgressTracker } from '@/lib/progress-tracker';

export async function POST(request: NextRequest) {
  const { host, port, user, password, secure, mailboxId } = await request.json();

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const progressTracker = new ProgressTracker();
      
      progressTracker.subscribe((update) => {
        const data = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(encoder.encode(data));
      });

      try {
        const emails = await EmailService.scanMailbox(config, mailboxId, progressTracker);
        await EmailService.saveEmails(emails, progressTracker);
        
        const finalUpdate = {
          type: 'complete',
          message: `Scan complete! Found and saved ${emails.length} emails.`,
          total: emails.length
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
        controller.close();
      } catch (error) {
        const errorUpdate = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
