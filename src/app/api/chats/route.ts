import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Only get the last message for the unread count/last message simulation
        },
      },
    });

    // We calculate simulated unread counts based on messages (or you could store unreadCount in the DB)
    const chats = contacts.map((contact) => {
      const assignedAgent = contact.assignments[0]?.user;
      let initials = undefined;
      
      if (assignedAgent) {
        initials = assignedAgent.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
      }

      // To calculate unread count properly we need more logic, but for MVP we mock or use existing
      // Since schema doesn't have unreadCount, we'll return 0 or randomly mock if status is UNASSIGNED
      const unreadCount = contact.status === 'UNASSIGNED' ? 1 : 0; 

      return {
        id: contact.id,
        customerName: contact.name || contact.phoneNumber,
        phoneNumber: contact.phoneNumber,
        lastMessage: contact.lastMessage || '',
        timestamp: contact.lastMessageAt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(contact.lastMessageAt) : '',
        unreadCount,
        status: contact.status,
        assignedAgentInitials: initials,
        assignedAgentName: assignedAgent?.name
      };
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
