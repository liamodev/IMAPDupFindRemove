import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid email IDs' },
        { status: 400 }
      );
    }

    await EmailService.deleteEmails(ids);

    return NextResponse.json({
      success: true,
      message: `Deleted ${ids.length} emails`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting emails:', error);
    return NextResponse.json(
      { error: 'Failed to delete emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
