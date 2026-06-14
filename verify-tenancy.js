const { chromium, request } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getContacts(workspaceSlug) {
  const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
  return prisma.contact.findMany({ where: { workspaceId: ws.id } });
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome' });
  
  async function getToken(email, password) {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');
    
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token');
    return `${sessionCookie.name}=${sessionCookie.value}`;
  }

  try {
    const aliCookie = await getToken('ali@iraqrasael.test', 'dev-password-123');
    const omarCookie = await getToken('omar@iraqrasael.test', 'dev-password-123');

    const headers = (cookie) => ({
      'Cookie': cookie,
      'Content-Type': 'application/json'
    });

    console.log("--- T1: Ali (Acme) fetches chats ---");
    let res = await fetch('http://localhost:3000/api/chats', { headers: headers(aliCookie) });
    console.log(`Status: ${res.status}`);
    const acmeChats = await res.json();
    console.log(`Chats returned: ${acmeChats.length}`);

    console.log("--- T2: Omar (Demo) fetches chats ---");
    res = await fetch('http://localhost:3000/api/chats', { headers: headers(omarCookie) });
    console.log(`Status: ${res.status}`);
    const demoChats = await res.json();
    console.log(`Chats returned: ${demoChats.length}`);

    console.log("--- T3: Ali (Acme) attempts to read Demo chat (cross-tenant) ---");
    const demoContacts = await getContacts('demo');
    res = await fetch(`http://localhost:3000/api/chats/${demoContacts[0].id}/messages`, { headers: headers(aliCookie) });
    console.log(`Status: ${res.status}`);

    console.log("--- T4: Ali (Acme) attempts to assign Demo chat (cross-tenant) ---");
    res = await fetch(`http://localhost:3000/api/chats/assign`, { 
      method: 'POST',
      headers: headers(aliCookie),
      body: JSON.stringify({ contactId: demoContacts[0].id, agentId: 'dummy' })
    });
    console.log(`Status: ${res.status}`);

    console.log("--- T5: Omar (Demo) attempts to send message to Acme chat (cross-tenant) ---");
    const acmeContacts = await getContacts('acme');
    res = await fetch(`http://localhost:3000/api/chats/send`, { 
      method: 'POST',
      headers: headers(omarCookie),
      body: JSON.stringify({ contactId: acmeContacts[0].id, text: 'Hello', agentId: 'dummy' })
    });
    console.log(`Status: ${res.status}`);

  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

run().catch(console.error);
