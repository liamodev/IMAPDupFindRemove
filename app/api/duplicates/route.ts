import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mailboxId = searchParams.get('mailboxId');
    const mailbox1Id = searchParams.get('mailbox1Id');
    const mailbox2Id = searchParams.get('mailbox2Id');

    let duplicates;

    if (mailbox1Id && mailbox2Id) {
      // Cross-mailbox comparison
      duplicates = await EmailService.findCrossMailboxDuplicates(mailbox1Id, mailbox2Id);
    } else {
      // Single mailbox or all mailboxes
      duplicates = await EmailService.findDuplicates(mailboxId || undefined);
    }

    return NextResponse.json({
      success: true,
      duplicates,
      count: duplicates.length
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to find duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
