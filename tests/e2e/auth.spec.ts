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
