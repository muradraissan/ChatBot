import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const contactId = resolvedParams.id;

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        contactId,
      },
      orderBy: {
        timestamp: 'asc', // Chronological order
      },
      include: {
        user: true, // Include agent details if it was sent by an agent
      }
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      text: msg.content,
      senderType: msg.senderType,
      timestamp: new Intl.DateTimeFormat('en-US', { 
        weekday: 'short', 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      }).format(msg.timestamp),
      agentName: msg.user?.name
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
