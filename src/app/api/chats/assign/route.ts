import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, agentId } = body;

    if (!contactId || !agentId) {
      return NextResponse.json({ error: 'Missing contactId or agentId' }, { status: 400 });
    }

    // Check if the agent exists
    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Upsert the assignment (ensure only one assignment exists per contact)
    const assignment = await prisma.agentAssignment.upsert({
      where: {
        contactId: contactId,
      },
      update: {
        userId: agentId,
        assignedAt: new Date(),
      },
      create: {
        contactId,
        userId: agentId,
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
