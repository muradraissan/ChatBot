import { PrismaClient, Role, ChatStatus, SenderType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean the database
  await prisma.agentAssignment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();

  // Create Agents
  const agentAli = await prisma.user.create({
    data: {
      name: 'Ali Hassan',
      email: 'ali@iraqrasael.com',
      role: Role.AGENT,
    },
  });

  const agentSara = await prisma.user.create({
    data: {
      name: 'Sara Ahmed',
      email: 'sara@iraqrasael.com',
      role: Role.AGENT,
    },
  });

  console.log('Agents created:', [agentAli.name, agentSara.name]);

  // Create Contacts
  const contact1 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647701112222',
      name: 'Zainab Qasim',
      status: ChatStatus.ACTIVE,
      lastMessage: 'Sure, I can send the payment tomorrow.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      avatarUrl: 'https://i.pravatar.cc/150?u=zainab',
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647803334444',
      name: 'Omar Farooq',
      status: ChatStatus.UNASSIGNED,
      lastMessage: 'Is this product still in stock?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      avatarUrl: 'https://i.pravatar.cc/150?u=omar',
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647505556666',
      name: 'Layla Mansour',
      status: ChatStatus.ACTIVE,
      lastMessage: 'Thank you for the help!',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      avatarUrl: 'https://i.pravatar.cc/150?u=layla',
    },
  });

  const contact4 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647907778888',
      name: 'Ahmed Tariq',
      status: ChatStatus.RESOLVED,
      lastMessage: 'Order received.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmed',
    },
  });

  console.log('Contacts created.');

  // Create Assignments
  await prisma.agentAssignment.create({
    data: {
      userId: agentAli.id,
      contactId: contact1.id,
    },
  });

  await prisma.agentAssignment.create({
    data: {
      userId: agentSara.id,
      contactId: contact3.id,
    },
  });

  console.log('Assignments created.');

  // Create Messages for Contact 1 (Zainab - assigned to Ali)
  await prisma.message.createMany({
    data: [
      {
        contactId: contact1.id,
        content: 'Hello, I would like to order the premium package.',
        senderType: SenderType.CUSTOMER,
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        contactId: contact1.id,
        userId: agentAli.id,
        content: 'Hello Zainab! Happy to help. How would you like to pay?',
        senderType: SenderType.AGENT,
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
      },
      {
        contactId: contact1.id,
        content: 'Sure, I can send the payment tomorrow.',
        senderType: SenderType.CUSTOMER,
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
  });

  // Create Messages for Contact 2 (Omar - Unassigned)
  await prisma.message.createMany({
    data: [
      {
        contactId: contact2.id,
        content: 'Is this product still in stock?',
        senderType: SenderType.CUSTOMER,
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
      },
    ],
  });

  // Create Messages for Contact 3 (Layla - assigned to Sara)
  await prisma.message.createMany({
    data: [
      {
        contactId: contact3.id,
        content: 'My tracking number is not working.',
        senderType: SenderType.CUSTOMER,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        contactId: contact3.id,
        userId: agentSara.id,
        content: 'Let me check that for you. Ah, here is the updated link: https://track.com/123',
        senderType: SenderType.AGENT,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      },
      {
        contactId: contact3.id,
        content: 'Thank you for the help!',
        senderType: SenderType.CUSTOMER,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ],
  });

  console.log('Messages created.');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
