import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://47.113.118.74',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // 只用系统安装的 Google Chrome，不下载额外浏览器
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // 远程服务器测试，无需启动本地服务
  // 切换回本地测试时，取消以下注释：
  // webServer: [
  //   {
  //     command: 'cd backend && node src/server.js',
  //     port: 3001,
  //     timeout: 10000,
  //     reuseExistingServer: true,
  //   },
  //   {
  //     command: 'cd frontend && npx vite --host 127.0.0.1',
  //     port: 5173,
  //     timeout: 10000,
  //     reuseExistingServer: true,
  //   },
  // ],
});
