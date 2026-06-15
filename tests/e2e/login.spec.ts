import { test, expect } from '@playwright/test';

test('登录测试', async ({ page }) => {
  // 访问登录页面
  await page.goto('http://127.0.0.1:5173/login');

  // 等待页面加载完成
  await page.waitForLoadState('networkidle');

  // 填写账号密码
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin');

  // 点击登录按钮
  await page.click('button:has-text("登录")');

  // 等待登录完成，检查是否跳转到首页
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

  // 保持浏览器打开以便观察
  await page.pause();
});