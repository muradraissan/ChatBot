import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { contactId, text } = body;

    if (!contactId || !text) {
      return NextResponse.json({ error: 'Missing contactId or text' }, { status: 400 });
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId: session.user.workspaceId
      }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Save the message
    const message = await prisma.message.create({
      data: {
        contactId,
        userId: session.user.id,
        content: text,
        senderType: 'AGENT',
        workspaceId: session.user.workspaceId,
      }
    });

    // Update the contact's last message
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        lastMessage: text,
        lastMessageAt: new Date(),
        status: 'ACTIVE' // Actively communicating
      }
    });

    // NOTE: In a real application, you would trigger the WhatsApp Business API webhook here
    // e.g. await sendWhatsAppMessage(contact.phoneNumber, text)

    return NextResponse.json({ 
      success: true, 
      message: {
        id: message.id,
        text: message.content,
        senderType: message.senderType,
        timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(message.timestamp)
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
