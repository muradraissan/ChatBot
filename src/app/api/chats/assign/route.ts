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
    const { contactId, newAgentId } = body;

    if (!contactId) {
      return NextResponse.json({ error: 'Missing contactId' }, { status: 400 });
    }

    // Tenancy check for contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId: session.user.workspaceId
      }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Mode detection: check existing assignment
    const existingAssignment = await prisma.agentAssignment.findUnique({
      where: { contactId }
    });

    if (!existingAssignment) {
      // Mode A — GRAB
      try {
        const assignment = await prisma.agentAssignment.create({
          data: {
            contactId,
            userId: session.user.id,
            workspaceId: session.user.workspaceId,
          }
        });

        // Update contact status
        await prisma.contact.update({
          where: { id: contactId },
          data: { status: 'ACTIVE' }
        });

        return NextResponse.json({ success: true, assignment });
      } catch (error: any) {
        // P2002: Unique constraint failed on the fields: (`contactId`)
        if (error.code === 'P2002') {
          const winnerAssignment = await prisma.agentAssignment.findUnique({
            where: { contactId },
            include: { user: true }
          });
          return NextResponse.json({
            error: 'Already assigned',
            assignedTo: {
              id: winnerAssignment?.user?.id,
              name: winnerAssignment?.user?.name
            }
          }, { status: 409 });
        }
        throw error;
      }
    } else {
      // Mode B — TRANSFER
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can reassign' }, { status: 403 });
      }

      if (!newAgentId) {
        const winner = await prisma.user.findUnique({ where: { id: existingAssignment.userId } });
        return NextResponse.json({
          error: 'Already assigned',
          assignedTo: { id: winner?.id, name: winner?.name }
        }, { status: 409 });
      }

      // Validate newAgentId tenancy
      const newAgent = await prisma.user.findFirst({
        where: {
          id: newAgentId,
          workspaceId: session.user.workspaceId
        }
      });

      if (!newAgent) {
        return NextResponse.json({ error: 'New agent not found in workspace' }, { status: 404 });
      }

      const assignment = await prisma.agentAssignment.update({
        where: { contactId },
        data: {
          userId: newAgentId,
          assignedAt: new Date()
        }
      });

      // Update contact status to ACTIVE (if it wasn't already)
      await prisma.contact.update({
        where: { id: contactId },
        data: { status: 'ACTIVE' }
      });

      return NextResponse.json({ success: true, assignment });
    }
  } catch (error) {
    console.error('Error assigning agent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
