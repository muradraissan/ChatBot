import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {

  test('login flow works end to end', async ({ page }) => {
    await page.goto('/login');
    
    // Fill the login form
    await page.fill('input[type="email"]', 'ali@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Expect URL to become /dashboard/inbox within 5s
    await expect(page).toHaveURL(/.*\/dashboard\/inbox/, { timeout: 5000 });
    
    // Expect at least one chat row visible in the inbox sidebar
    // From earlier screenshots/DOM, sidebar rows have class "p-3 hover:bg-gray-100 cursor-pointer" or text "Zainab" etc.
    // Let's just wait for a known text or contact div. 
    // In T1, "Zainab Qasim (Acme)" is fetched.
    await expect(page.locator('text=Zainab Qasim (Acme)').first()).toBeVisible({ timeout: 5000 });
  });

  test('wrong password fails cleanly', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'ali@iraqrasael.test');
    await page.fill('input[type="password"]', 'wrong-password');
    
    await page.click('button[type="submit"]');
    
    // Expect to stay on /login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Expect Arabic error text visible
    await expect(page.locator('text=الإيميل أو كلمة المرور غير صحيحة')).toBeVisible();
  });

  test('logged-out user is redirected from dashboard', async ({ context, page }) => {
    // Clear cookies
    await context.clearCookies();
    
    await page.goto('/dashboard/inbox');
    
    // Expect URL to become /login
    await expect(page).toHaveURL(/.*\/login/);
  });

});

test.describe('Message attribution', () => {
  test('send route uses session identity, ignores body agentId', async ({ page, request }) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const ali = await prisma.user.findUnique({ where: { email: 'ali@iraqrasael.test' } });
    const sara = await prisma.user.findUnique({ where: { email: 'sara@iraqrasael.test' } });
    const acmeContact = await prisma.contact.findFirst({ where: { workspaceId: ali.workspaceId } });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'ali@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    const response = await page.request.post('/api/chats/send', {
      data: {
        contactId: acmeContact.id,
        text: 'attribution test',
        agentId: sara.id
      }
    });

    expect(response.status()).toBe(200);

    const message = await prisma.message.findFirst({
      where: { content: 'attribution test', contactId: acmeContact.id },
      orderBy: { timestamp: 'desc' }
    });

    expect(message.userId).toBe(ali.id);
    expect(message.userId).not.toBe(sara.id);
    expect(message.userId).not.toBeNull();
    
    await prisma.$disconnect();
  });
});

test.describe('Assignment collision & transfer', () => {
  test('grab succeeds for unassigned contact', async ({ page }) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const sara = await prisma.user.findUnique({ where: { email: 'sara@iraqrasael.test' } });
    const acmeContact = await prisma.contact.findFirst({ where: { workspaceId: sara.workspaceId } });
    
    // Ensure contact is unassigned
    await prisma.agentAssignment.deleteMany({ where: { contactId: acmeContact.id } });

    // Login as Sara
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sara@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    // POST /api/chats/assign { contactId }
    const response = await page.request.post('/api/chats/assign', {
      data: { contactId: acmeContact.id }
    });

    expect(response.status()).toBe(200);

    const assignment = await prisma.agentAssignment.findUnique({ where: { contactId: acmeContact.id } });
    expect(assignment.userId).toBe(sara.id);
    expect(assignment.workspaceId).toBe(sara.workspaceId);

    await prisma.$disconnect();
  });

  test('second grab returns 409 with winner identity', async ({ page }) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const ali = await prisma.user.findUnique({ where: { email: 'ali@iraqrasael.test' } });
    const sara = await prisma.user.findUnique({ where: { email: 'sara@iraqrasael.test' } });
    const acmeContact = await prisma.contact.findFirst({ where: { workspaceId: ali.workspaceId } });

    // Start with unassigned
    await prisma.agentAssignment.deleteMany({ where: { contactId: acmeContact.id } });

    // Login as Sara
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sara@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    // Sara grabs it
    const saraResponse = await page.request.post('/api/chats/assign', {
      data: { contactId: acmeContact.id }
    });
    expect(saraResponse.status()).toBe(200);

    // Now login as Ali
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', 'ali@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    // Ali tries to grab
    const aliResponse = await page.request.post('/api/chats/assign', {
      data: { contactId: acmeContact.id }
    });

    expect(aliResponse.status()).toBe(409);
    const body = await aliResponse.json();
    expect(body.error).toBe('Already assigned');
    expect(body.assignedTo.id).toBe(sara.id);
    expect(body.assignedTo.name).toBe(sara.name);

    // Verify it wasn't overwritten
    const assignment = await prisma.agentAssignment.findUnique({ where: { contactId: acmeContact.id } });
    expect(assignment.userId).toBe(sara.id);

    await prisma.$disconnect();
  });

  test('non-admin cannot transfer', async ({ page }) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const ali = await prisma.user.findUnique({ where: { email: 'ali@iraqrasael.test' } });
    const sara = await prisma.user.findUnique({ where: { email: 'sara@iraqrasael.test' } }); // AGENT
    const acmeContact = await prisma.contact.findFirst({ where: { workspaceId: sara.workspaceId } });

    // Assign contact to Sara
    await prisma.agentAssignment.upsert({
      where: { contactId: acmeContact.id },
      update: { userId: sara.id },
      create: { contactId: acmeContact.id, userId: sara.id, workspaceId: sara.workspaceId }
    });

    // Login as Sara (AGENT)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sara@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    // Try to transfer to Ali
    const response = await page.request.post('/api/chats/assign', {
      data: { contactId: acmeContact.id, newAgentId: ali.id }
    });

    expect(response.status()).toBe(403);
    
    // Verify unchanged
    const assignment = await prisma.agentAssignment.findUnique({ where: { contactId: acmeContact.id } });
    expect(assignment.userId).toBe(sara.id);

    await prisma.$disconnect();
  });

  test('admin transfers assignment', async ({ page }) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const ali = await prisma.user.findUnique({ where: { email: 'ali@iraqrasael.test' } }); // ADMIN
    const sara = await prisma.user.findUnique({ where: { email: 'sara@iraqrasael.test' } });
    const acmeContact = await prisma.contact.findFirst({ where: { workspaceId: ali.workspaceId } });

    // Assign contact to Sara
    await prisma.agentAssignment.upsert({
      where: { contactId: acmeContact.id },
      update: { userId: sara.id },
      create: { contactId: acmeContact.id, userId: sara.id, workspaceId: sara.workspaceId }
    });

    // Login as Ali (ADMIN)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'ali@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    // Transfer to Ali
    const response = await page.request.post('/api/chats/assign', {
      data: { contactId: acmeContact.id, newAgentId: ali.id }
    });

    expect(response.status()).toBe(200);
    
    // Verify changed
    const assignment = await prisma.agentAssignment.findUnique({ where: { contactId: acmeContact.id } });
    expect(assignment.userId).toBe(ali.id);

    await prisma.$disconnect();
  });

  test('admin cannot transfer to foreign-workspace agent', async ({ page }) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const ali = await prisma.user.findUnique({ where: { email: 'ali@iraqrasael.test' } }); // ADMIN
    const omar = await prisma.user.findUnique({ where: { email: 'omar@iraqrasael.test' } }); // DEMO
    const acmeContact = await prisma.contact.findFirst({ where: { workspaceId: ali.workspaceId } });

    // Assign contact to Ali
    await prisma.agentAssignment.upsert({
      where: { contactId: acmeContact.id },
      update: { userId: ali.id },
      create: { contactId: acmeContact.id, userId: ali.id, workspaceId: ali.workspaceId }
    });

    // Login as Ali
    await page.goto('/login');
    await page.fill('input[type="email"]', 'ali@iraqrasael.test');
    await page.fill('input[type="password"]', 'dev-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/inbox');

    // Transfer to Omar (Demo)
    const response = await page.request.post('/api/chats/assign', {
      data: { contactId: acmeContact.id, newAgentId: omar.id }
    });

    expect(response.status()).toBe(404);

    await prisma.$disconnect();
  });
});
