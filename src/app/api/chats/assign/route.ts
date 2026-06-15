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
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json({ error: 'Missing contactId' }, { status: 400 });
    }

    // Check if the agent exists
    const agent = await prisma.user.findFirst({ 
      where: { 
        id: session.user.id,
        workspaceId: session.user.workspaceId
      } 
    });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
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

    // Upsert the assignment (ensure only one assignment exists per contact)
    const assignment = await prisma.agentAssignment.upsert({
      where: {
        contactId: contactId,
      },
      update: {
        userId: session.user.id,
        assignedAt: new Date(),
      },
      create: {
        contactId,
        userId: session.user.id,
        workspaceId: session.user.workspaceId,
      }
    });

    // Update the contact status to ACTIVE
    await prisma.contact.update({
      where: { id: contactId },
      data: { status: 'ACTIVE' }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Error assigning agent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
