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
