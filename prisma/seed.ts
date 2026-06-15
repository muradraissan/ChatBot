import { PrismaClient, Role, ChatStatus, SenderType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean the database
  await prisma.agentAssignment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const passwordHash = await bcrypt.hash('dev-password-123', 10);

  // Create Workspaces
  const acme = await prisma.workspace.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Trading',
      slug: 'acme',
    },
  });

  const demo = await prisma.workspace.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Co',
      slug: 'demo',
    },
  });

  console.log('Workspaces created:', [acme.name, demo.name]);

  // Create Agents for Acme
  const agentAli = await prisma.user.upsert({
    where: { email: 'ali@iraqrasael.test' },
    update: { passwordHash, role: Role.AGENT, name: 'Ali Hassan', workspaceId: acme.id },
    create: {
      name: 'Ali Hassan',
      email: 'ali@iraqrasael.test',
      passwordHash,
      role: Role.AGENT,
      workspaceId: acme.id,
    },
  });

  const agentSara = await prisma.user.upsert({
    where: { email: 'sara@iraqrasael.test' },
    update: { passwordHash, role: Role.AGENT, name: 'Sara Ahmed', workspaceId: acme.id },
    create: {
      name: 'Sara Ahmed',
      email: 'sara@iraqrasael.test',
      passwordHash,
      role: Role.AGENT,
      workspaceId: acme.id,
    },
  });

  // Create Agents for Demo
  const agentOmar = await prisma.user.upsert({
    where: { email: 'omar@iraqrasael.test' },
    update: { passwordHash, role: Role.AGENT, name: 'Omar Farooq', workspaceId: demo.id },
    create: {
      name: 'Omar Farooq',
      email: 'omar@iraqrasael.test',
      passwordHash,
      role: Role.AGENT,
      workspaceId: demo.id,
    },
  });

  const agentLayla = await prisma.user.upsert({
    where: { email: 'layla@iraqrasael.test' },
    update: { passwordHash, role: Role.AGENT, name: 'Layla Mansour', workspaceId: demo.id },
    create: {
      name: 'Layla Mansour',
      email: 'layla@iraqrasael.test',
      passwordHash,
      role: Role.AGENT,
      workspaceId: demo.id,
    },
  });

  console.log('Agents created.');

  // Create Contacts for Acme
  const acmeContact1 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647701112222', // SHARED PHONE NUMBER
      name: 'Zainab Qasim (Acme)',
      status: ChatStatus.ACTIVE,
      lastMessage: 'Sure, I can send the payment tomorrow.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
      avatarUrl: 'https://i.pravatar.cc/150?u=zainab_acme',
      workspaceId: acme.id,
    },
  });

  const acmeContact2 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647803334444',
      name: 'Ameer Ali',
      status: ChatStatus.UNASSIGNED,
      lastMessage: 'Is this product still in stock?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15),
      avatarUrl: 'https://i.pravatar.cc/150?u=ameer',
      workspaceId: acme.id,
    },
  });

  // Create Contacts for Demo
  const demoContact1 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647701112222', // SHARED PHONE NUMBER
      name: 'Zainab Qasim (Demo)',
      status: ChatStatus.ACTIVE,
      lastMessage: 'I need help with my Demo account.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      avatarUrl: 'https://i.pravatar.cc/150?u=zainab_demo',
      workspaceId: demo.id,
    },
  });

  const demoContact2 = await prisma.contact.create({
    data: {
      phoneNumber: '+9647907778888',
      name: 'Ahmed Tariq',
      status: ChatStatus.RESOLVED,
      lastMessage: 'Order received.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmed',
      workspaceId: demo.id,
    },
  });

  console.log('Contacts created.');

  // Create Assignments
  await prisma.agentAssignment.create({
    data: {
      userId: agentAli.id,
      contactId: acmeContact1.id,
      workspaceId: acme.id,
    },
  });

  await prisma.agentAssignment.create({
    data: {
      userId: agentOmar.id,
      contactId: demoContact1.id,
      workspaceId: demo.id,
    },
  });

  console.log('Assignments created.');

  // Create Messages for Acme Contact 1
  await prisma.message.createMany({
    data: [
      {
        contactId: acmeContact1.id,
        content: 'Hello, I would like to order the premium package.',
        senderType: SenderType.CUSTOMER,
        workspaceId: acme.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        contactId: acmeContact1.id,
        userId: agentAli.id,
        content: 'Hello Zainab! Happy to help. How would you like to pay?',
        senderType: SenderType.AGENT,
        workspaceId: acme.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
      },
      {
        contactId: acmeContact1.id,
        content: 'Sure, I can send the payment tomorrow.',
        senderType: SenderType.CUSTOMER,
        workspaceId: acme.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
  });

  // Create Messages for Demo Contact 1
  await prisma.message.createMany({
    data: [
      {
        contactId: demoContact1.id,
        content: 'My tracking number is not working.',
        senderType: SenderType.CUSTOMER,
        workspaceId: demo.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        contactId: demoContact1.id,
        userId: agentOmar.id,
        content: 'Let me check that for you.',
        senderType: SenderType.AGENT,
        workspaceId: demo.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      },
      {
        contactId: demoContact1.id,
        content: 'I need help with my Demo account.',
        senderType: SenderType.CUSTOMER,
        workspaceId: demo.id,
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
