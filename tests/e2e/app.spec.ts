import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════
// 打印模板中心 E2E 测试
// ═══════════════════════════════════════════════════

test.describe('权限守卫', () => {
  test('未登录访问任何页面应跳转到 /login', async ({ page }) => {
    await page.goto('/templates');
    await expect(page).toHaveURL('/login');
  });

  test('未登录访问系统管理页应跳转到 /login', async ({ page }) => {
    await page.goto('/system/users');
    await expect(page).toHaveURL('/login');
  });

  test('直接访问 /login 正常显示登录页', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('打印模板中心');
    await expect(page.getByPlaceholder('任意用户名均可登录')).toBeVisible();
  });
});

test.describe('登录流程', () => {
  test('Mock 登录成功后跳转模板列表', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page).toHaveURL('/templates');
  });

  test('登录后显示用户昵称', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page.locator('.user-info')).toContainText('系统管理员');
  });

  test('退出登录后跳回登录页', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page).toHaveURL('/templates');

    // 退出
    await page.locator('.user-info').click();
    await page.getByText('退出登录').click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('左侧菜单导航', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page).toHaveURL('/templates');
  });

  test('菜单显示模板管理分组', async ({ page }) => {
    await expect(page.locator('.ant-menu-item-group-title').filter({ hasText: '模板管理' })).toBeVisible();
  });

  test('菜单显示字段与数据分组', async ({ page }) => {
    await expect(page.locator('.ant-menu-item-group-title').filter({ hasText: '字段与数据' })).toBeVisible();
  });

  test('菜单显示系统管理分组', async ({ page }) => {
    await expect(page.locator('.ant-menu-item-group-title').filter({ hasText: '系统管理' })).toBeVisible();
  });

  test('点击菜单项可切换页面', async ({ page }) => {
    // 模板列表 → 模版字段
    await page.locator('.ant-menu-item').filter({ hasText: '模版字段' }).click();
    await expect(page).toHaveURL('/fields');

    // 模版字段 → 业务数据
    await page.locator('.ant-menu-item').filter({ hasText: '业务数据' }).click();
    await expect(page).toHaveURL('/business');

    // 业务数据 → 用户管理
    await page.locator('.ant-menu-item').filter({ hasText: '用户管理' }).click();
    await expect(page).toHaveURL('/system/users');
  });
});

test.describe('模板列表', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page).toHaveURL('/templates');
  });

  test('页面加载后显示模板列表数据', async ({ page }) => {
    await expect(page.locator('.ant-table-tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('模板编码可点击', async ({ page }) => {
    const codeLink = page.locator('.ant-table-tbody tr').first().locator('a');
    await expect(codeLink).toBeVisible({ timeout: 15000 });
  });

  test('点击模板编码跳转到设计器', async ({ page }) => {
    const codeLink = page.locator('.ant-table-tbody tr').first().locator('a');
    await codeLink.click({ timeout: 15000 });
    await expect(page).toHaveURL(/\/templates\/\d+\/designer/);
  });

  test('筛选条件可正常切换', async ({ page }) => {
    // 类型筛选 — 点击第一个 select 展开下拉
    await page.locator('.filter-card .ant-select').first().click();
    await page.locator('.ant-select-item-option').filter({ hasText: '库位模板' }).click();
    // 点击查询按钮 (AntDV renders "查 询" with space after icon)
    await page.locator('.filter-card button').filter({ hasText: /查.*询/ }).click();
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
  });
});

test.describe('模板设计器', () => {
  test.beforeEach(async ({ page }) => {
    // 登录 → 模板列表 → 点击第一个模板进入设计器
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page).toHaveURL('/templates');
    await page.locator('.ant-table-tbody tr').first().locator('a').click({ timeout: 15000 });
    await expect(page).toHaveURL(/\/templates\/\d+\/designer/);
  });

  test('设计器三栏布局正常显示', async ({ page }) => {
    // 左侧组件面板
    await expect(page.locator('.toolbox')).toBeVisible({ timeout: 10000 });
    // 中间画布
    await expect(page.locator('.canvas-stage')).toBeVisible();
    // 右侧属性面板（初始未选元素，显示空状态）
    await expect(page.locator('.props-panel')).toBeVisible();
  });

  test('设计器工具栏显示正常', async ({ page }) => {
    await expect(page.getByText('返回列表')).toBeVisible();
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    await expect(page.getByRole('button', { name: '发布' })).toBeVisible();
  });

  test('组件面板有可拖拽组件', async ({ page }) => {
    const compSection = page.locator('.toolbox');
    await expect(compSection).toBeVisible();
    await expect(compSection.locator('.component-btn').first()).toBeVisible();
  });

  test('点击返回列表回到模板列表', async ({ page }) => {
    await page.getByText('返回列表').click();
    await expect(page).toHaveURL('/templates');
  });
});

test.describe('模版字段', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
    await page.locator('.ant-menu-item').filter({ hasText: '模版字段' }).click();
    await expect(page).toHaveURL('/fields');
  });

  test('tab 切换可正常显示三个类型的字段', async ({ page }) => {
    await expect(page.getByText('库位字段')).toBeVisible();
    await page.getByText('容器字段').click();
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
    await page.getByText('商品字段').click();
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
  });

  test('字段表格包含中文名称和编码列', async ({ page }) => {
    await expect(page.locator('.ant-table-thead')).toContainText('中文名称');
    await expect(page.locator('.ant-table-thead')).toContainText('字段编码');
  });
});

test.describe('系统管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('任意用户名均可登录').fill('admin');
    await page.getByPlaceholder('任意密码均可登录').fill('123456');
    await page.getByRole('button', { name: '登 录' }).click();
  });

  test('用户管理页可加载', async ({ page }) => {
    await page.locator('.ant-menu-item').filter({ hasText: '用户管理' }).click();
    await expect(page).toHaveURL('/system/users');
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(page.locator('.ant-table-tbody')).toContainText('admin');
  });

  test('角色管理页可加载', async ({ page }) => {
    await page.locator('.ant-menu-item').filter({ hasText: '角色管理' }).click();
    await expect(page).toHaveURL('/system/roles');
    await expect(page.locator('.ant-table-tbody')).toContainText('管理员');
  });

  test('菜单管理页可加载', async ({ page }) => {
    await page.locator('.ant-menu-item').filter({ hasText: '菜单管理' }).click();
    await expect(page).toHaveURL('/system/menus');
    await expect(page.locator('.ant-table-tbody')).toContainText('模板列表');
  });

  test('用户管理新增用户弹窗', async ({ page }) => {
    await page.locator('.ant-menu-item').filter({ hasText: '用户管理' }).click();
    await page.getByRole('button', { name: '新增用户' }).click();
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('新增用户');
  });

  test('角色管理新增角色弹窗', async ({ page }) => {
    await page.locator('.ant-menu-item').filter({ hasText: '角色管理' }).click();
    await page.getByRole('button', { name: '新增角色' }).click();
    await expect(page.locator('.ant-modal')).toBeVisible();
  });
});
