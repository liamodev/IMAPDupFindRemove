import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { ProgressTracker } from '@/lib/progress-tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, user, password, secure } = body;

    if (!host || !port || !user || !password) {
      return NextResponse.json(
        { error: 'Missing required IMAP configuration' },
        { status: 400 }
      );
    }

    const config = {
      host,
      port: parseInt(port),
      user,
      password,
      secure: secure || false
    };

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const progressTracker = new ProgressTracker();
        
        progressTracker.subscribe((update) => {
          const data = JSON.stringify(update);
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        });

        // Start the folder structure scan
        EmailService.getFolderStructure(config, progressTracker)
          .then((folderStructure) => {
            console.log('API: Folder structure received:', folderStructure);
            const totalEmails = folderStructure.reduce((sum, folder) => sum + folder.emailCount, 0);
            console.log('API: Total emails:', totalEmails);
            const finalData = JSON.stringify({
              type: 'complete',
              data: folderStructure,
              message: `Found ${folderStructure.length} folders with ${totalEmails} total emails`
            });
            console.log('API: Sending final data:', finalData);
            controller.enqueue(new TextEncoder().encode(`data: ${finalData}\n\n`));
            controller.close();
          })
          .catch((error) => {
            const errorData = JSON.stringify({
              type: 'error',
              message: error.message
            });
            controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
            controller.close();
          });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in folder structure scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

