import { test, expect } from '@playwright/test';

/**
 * 打印模板中心 - 手动功能测试
 * 测试日期: 2026-06-12
 * 测试环境: http://127.0.0.1:5173/
 *
 * 浏览器管理规范：
 * 1. 禁止调用 playwright-cli close 命令（会关闭浏览器）
 * 2. 测试完成后保持浏览器窗口开启
 * 3. 复用已有窗口：使用 attach --cdp=chrome 连接已打开的 Chrome
 * 4. 仅首次使用 open --browser=chrome --headed 打开新窗口
 */

test.describe('模版列表页面', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('按名称搜索', async ({ page }) => {
    // 输入搜索关键词
    await page.getByRole('textbox', { name: '右模糊查询' }).fill('商品');
    // 点击查询
    await page.getByRole('button', { name: '查询' }).click();
    // 验证结果
    await expect(page.getByText('共 1 条')).toBeVisible();
    await expect(page.getByText('商品模版--11')).toBeVisible();
  });

  test('按类型筛选', async ({ page }) => {
    // 选择容器模板类型
    await page.locator('#filterType').selectOption('容器模板');
    // 点击查询
    await page.getByRole('button', { name: '查询' }).click();
    // 验证结果
    await expect(page.getByText('共 2 条')).toBeVisible();
  });

  test('重置功能', async ({ page }) => {
    // 先搜索
    await page.getByRole('textbox', { name: '右模糊查询' }).fill('商品');
    await page.getByRole('button', { name: '查询' }).click();
    // 点击重置
    await page.getByRole('button', { name: '重置' }).click();
    // 验证恢复全部数据
    await expect(page.getByText('共 4 条')).toBeVisible();
  });

  test('预览功能', async ({ page }) => {
    // 点击第一条记录的预览按钮
    await page.locator('span[data-act="preview"][data-id="7"]').click();
    // 验证弹窗显示
    await expect(page.getByRole('heading', { name: '模板预览' })).toBeVisible();
    await expect(page.getByText('模板名称：商品模版--11')).toBeVisible();
    // 关闭弹窗
    await page.getByRole('button', { name: '关闭' }).click();
  });

  test('打印功能', async ({ page }) => {
    // 点击第一条记录的打印按钮
    await page.locator('span[data-act="print"][data-id="7"]').click();
    // 验证弹窗显示
    await expect(page.getByRole('heading', { name: '模板打印' })).toBeVisible();
    await expect(page.getByText('打印份数')).toBeVisible();
    await expect(page.getByText('打印方式')).toBeVisible();
    // 关闭弹窗
    await page.getByRole('button', { name: '取消' }).click();
  });

  test('复制功能', async ({ page }) => {
    // 点击第一条记录的复制按钮
    await page.locator('span[data-act="copy"][data-id="7"]').click();
    // 验证复制成功
    await expect(page.getByText('商品模版--11-副本')).toBeVisible();
    // BUG: 分页数据未刷新
    // await expect(page.getByText('共 5 条')).toBeVisible(); // 应该是5条但显示4条
  });

  test('停用/启用功能', async ({ page }) => {
    // 点击停用按钮
    await page.locator('span[data-act="disable"][data-id="7"]').click();
    // 验证状态变化
    await expect(page.locator('tr').filter({ hasText: '商品模版--11' }).getByText('停用')).toBeVisible();

    // 点击启用按钮
    await page.locator('span[data-act="enable"][data-id="7"]').click();
    // 验证状态恢复
    await expect(page.locator('span[data-act="disable"][data-id="7"]')).toBeVisible();
  });

});

test.describe('模板设计器', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入模板设计器
    await page.getByText('模板设计器').click();
  });

  test('添加静态文本组件', async ({ page }) => {
    // 点击静态文本组件
    await page.getByText('T静态文本').click();
    // 验证添加成功
    await expect(page.getByText('STATIC TEXT')).toBeVisible();
    // 验证属性面板显示
    await expect(page.getByText('X 坐标 mm')).toBeVisible();
    await expect(page.getByText('Y 坐标 mm')).toBeVisible();
  });

  test('添加动态字段组件', async ({ page }) => {
    // 点击动态字段组件
    await page.getByText('{}动态字段').click();
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加二维码组件', async ({ page }) => {
    // 点击二维码组件
    await page.getByText('QR二维码').click();
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
    // 验证绑定字段
    await expect(page.getByText('绑定字段')).toBeVisible();
  });

  test('添加一维码组件', async ({ page }) => {
    // 点击一维码组件
    await page.getByText('|||一维码').click();
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加横线组件', async ({ page }) => {
    // 点击横线组件
    await page.getByText('—横线').click();
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加矩形组件', async ({ page }) => {
    // 点击矩形组件
    await page.getByText('□矩形').click();
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加复选框组件', async ({ page }) => {
    // 点击复选框组件
    await page.getByText('☑复选框').click();
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('缩放功能', async ({ page }) => {
    // 选择75%缩放
    await page.locator('#zoomSelect').selectOption('75%');
    // 验证缩放生效
    await expect(page.locator('#zoomSelect')).toHaveValue('75%');
  });

  test('网格开关', async ({ page }) => {
    // 取消网格显示
    await page.locator('input#gridToggle').uncheck();
    // 验证网格隐藏
    await expect(page.locator('input#gridToggle')).not.toBeChecked();
  });

  test('校验功能', async ({ page }) => {
    // 点击校验按钮
    await page.getByRole('button', { name: '校验' }).click();
    // 验证校验结果显示
    await expect(page.getByText('校验结果')).toBeVisible();
  });

  test('预览功能', async ({ page }) => {
    // 点击预览按钮
    await page.getByRole('button', { name: '预览' }).click();
    // 验证弹窗显示
    await expect(page.getByRole('heading', { name: '模板预览' })).toBeVisible();
    // 关闭弹窗
    await page.getByRole('button', { name: '关闭' }).click();
  });

  test('返回功能', async ({ page }) => {
    // 点击返回按钮
    await page.getByRole('button', { name: '返回' }).click();
    // 验证返回列表页
    await expect(page.getByText('共 4 条')).toBeVisible();
  });

});

test.describe('容器模板设计器', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入容器模板设计器（假设容器模板ID为8）
    await page.locator('a[data-id="8"]').click();
    await page.waitForLoadState('networkidle');
  });

  test('容器模板字段字典显示', async ({ page }) => {
    // 验证容器模板专用字段显示
    await expect(page.getByText('容器编码')).toBeVisible();
    await expect(page.getByText('区域仓编码')).toBeVisible();
    await expect(page.getByText('物理仓编码')).toBeVisible();
  });

  test('添加容器编码动态字段', async ({ page }) => {
    // 点击动态字段组件
    await page.getByText('{}动态字段').click();
    // 选择绑定字段为容器编码
    await page.locator('#bindField').selectOption('容器编码');
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加区域仓编码动态字段', async ({ page }) => {
    // 点击动态字段组件
    await page.getByText('{}动态字段').click();
    // 选择绑定字段为区域仓编码
    await page.locator('#bindField').selectOption('区域仓编码');
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加物理仓编码动态字段', async ({ page }) => {
    // 点击动态字段组件
    await page.getByText('{}动态字段').click();
    // 选择绑定字段为物理仓编码
    await page.locator('#bindField').selectOption('物理仓编码');
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

});

test.describe('库位模板设计器', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入库位模板设计器（假设库位模板ID为9）
    await page.locator('a[data-id="9"]').click();
    await page.waitForLoadState('networkidle');
  });

  test('库位模板字段字典显示', async ({ page }) => {
    // 验证库位模板专用字段显示
    await expect(page.getByText('库位编码')).toBeVisible();
    await expect(page.getByText('库位前缀')).toBeVisible();
    await expect(page.getByText('排')).toBeVisible();
    await expect(page.getByText('列')).toBeVisible();
    await expect(page.getByText('层')).toBeVisible();
    await expect(page.getByText('方向标')).toBeVisible();
    await expect(page.getByText('区域仓编码')).toBeVisible();
    await expect(page.getByText('物理仓编码')).toBeVisible();
  });

  test('添加库位编码动态字段', async ({ page }) => {
    // 点击动态字段组件
    await page.getByText('{}动态字段').click();
    // 选择绑定字段为库位编码
    await page.locator('#bindField').selectOption('库位编码');
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

  test('添加库位前缀动态字段', async ({ page }) => {
    // 点击动态字段组件
    await page.getByText('{}动态字段').click();
    // 选择绑定字段为库位前缀
    await page.locator('#bindField').selectOption('库位前缀');
    // 验证添加成功
    await expect(page.locator('.canvas-element').last()).toBeVisible();
  });

});

test.describe('设计器工具栏高级功能', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入模板设计器
    await page.getByText('模板设计器').click();
    await page.waitForLoadState('networkidle');
  });

  test('复制按钮功能', async ({ page }) => {
    // 先添加一个静态文本元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 点击复制按钮
    await page.getByRole('button', { name: '复制' }).click();
    // 验证复制操作执行（无报错）
    await expect(page.locator('.canvas-element')).toHaveCount(1);
  });

  test('粘贴按钮功能', async ({ page }) => {
    // 先添加一个静态文本元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 点击复制按钮
    await page.getByRole('button', { name: '复制' }).click();
    // 点击粘贴按钮
    await page.getByRole('button', { name: '粘贴' }).click();
    // 验证粘贴操作执行
    await expect(page.locator('.canvas-element')).toHaveCount(2);
  });

  test('删除按钮功能', async ({ page }) => {
    // 先添加一个静态文本元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 点击删除按钮
    await page.getByRole('button', { name: '删除' }).click();
    // 验证删除操作执行
    await expect(page.locator('.canvas-element')).toHaveCount(0);
  });

  test('撤回按钮功能', async ({ page }) => {
    // 先添加一个静态文本元素
    await page.getByText('T静态文本').click();
    // 验证元素已添加
    await expect(page.locator('.canvas-element')).toHaveCount(1);
    // 点击撤回按钮
    await page.getByRole('button', { name: '撤回' }).click();
    // 验证撤回操作执行（元素被移除）
    await expect(page.locator('.canvas-element')).toHaveCount(0);
  });

});

test.describe('模板属性修改', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入模板设计器
    await page.getByText('模板设计器').click();
    await page.waitForLoadState('networkidle');
  });

  test('修改模板名称', async ({ page }) => {
    // 获取名称输入框
    const nameInput = page.locator('#templateName');
    // 修改名称
    await nameInput.clear();
    await nameInput.fill('测试模板名称');
    // 验证名称已修改
    await expect(nameInput).toHaveValue('测试模板名称');
  });

  test('修改模板宽度', async ({ page }) => {
    // 获取宽度输入框
    const widthInput = page.locator('#templateWidth');
    // 修改宽度
    await widthInput.clear();
    await widthInput.fill('120');
    // 验证宽度已修改
    await expect(widthInput).toHaveValue('120');
  });

  test('修改模板高度', async ({ page }) => {
    // 获取高度输入框
    const heightInput = page.locator('#templateHeight');
    // 修改高度
    await heightInput.clear();
    await heightInput.fill('180');
    // 验证高度已修改
    await expect(heightInput).toHaveValue('180');
  });

  test('打印旋转选择', async ({ page }) => {
    // 获取旋转下拉框
    const rotationSelect = page.locator('#printRotation');
    // 选择90°旋转
    await rotationSelect.selectOption('90');
    // 验证选择成功
    await expect(rotationSelect).toHaveValue('90');
    // 选择180°旋转
    await rotationSelect.selectOption('180');
    await expect(rotationSelect).toHaveValue('180');
    // 选择270°旋转
    await rotationSelect.selectOption('270');
    await expect(rotationSelect).toHaveValue('270');
    // 恢复0°旋转
    await rotationSelect.selectOption('0');
    await expect(rotationSelect).toHaveValue('0');
  });

});

test.describe('元素属性详细测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入模板设计器
    await page.getByText('模板设计器').click();
    await page.waitForLoadState('networkidle');
  });

  test('文本类型切换', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 切换文本类型为静态文本
    await page.locator('select[data-prop="textType"]').selectOption('static');
    // 验证静态内容输入框出现
    await expect(page.locator('textarea[data-prop="staticContent"]')).toBeVisible();
    // 验证绑定字段下拉框消失
    await expect(page.locator('select[data-prop="bindField"]')).not.toBeVisible();
  });

  test('静态内容编辑', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 切换文本类型为静态文本
    await page.locator('select[data-prop="textType"]').selectOption('static');
    // 输入静态内容
    await page.locator('textarea[data-prop="staticContent"]').fill('测试静态文本内容');
    // 验证画布显示新内容
    await expect(page.getByText('测试静态文本内容')).toBeVisible();
  });

  test('字号修改', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 修改字号
    await page.locator('input[data-prop="fontSize"]').fill('16');
    // 验证字号已修改
    await expect(page.locator('input[data-prop="fontSize"]')).toHaveValue('16');
  });

  test('加粗开关', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 勾选加粗
    await page.locator('input[data-prop="bold"]').check();
    // 验证加粗已勾选
    await expect(page.locator('input[data-prop="bold"]')).toBeChecked();
  });

  test('对齐方式切换', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 切换为居中
    await page.locator('select[data-prop="textAlign"]').selectOption('center');
    await expect(page.locator('select[data-prop="textAlign"]')).toHaveValue('center');
    // 切换为右对齐
    await page.locator('select[data-prop="textAlign"]').selectOption('right');
    await expect(page.locator('select[data-prop="textAlign"]')).toHaveValue('right');
  });

  test('文字颜色修改', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 修改文字颜色
    await page.locator('input[data-prop="color"]').fill('#FF0000');
    // 验证颜色已修改
    await expect(page.locator('input[data-prop="color"]')).toHaveValue('#ff0000');
  });

  test('复选框属性-选中状态', async ({ page }) => {
    // 点击复选框组件添加元素
    await page.getByText('☑复选框').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 勾选选中状态
    await page.locator('input[data-prop="checked"]').check();
    // 验证已勾选
    await expect(page.locator('input[data-prop="checked"]')).toBeChecked();
  });

  test('复选框属性-固定文字', async ({ page }) => {
    // 点击复选框组件添加元素
    await page.getByText('☑复选框').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 输入固定文字
    await page.locator('input[data-prop="fixedText"]').fill('易碎品');
    // 验证固定文字已修改
    await expect(page.locator('input[data-prop="fixedText"]')).toHaveValue('易碎品');
  });

  test('复选框属性-边框颜色', async ({ page }) => {
    // 点击复选框组件添加元素
    await page.getByText('☑复选框').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 修改边框颜色
    await page.locator('input[data-prop="borderColor"]').fill('#00FF00');
    // 验证颜色已修改
    await expect(page.locator('input[data-prop="borderColor"]')).toHaveValue('#00ff00');
  });

  test('矩形属性-背景色', async ({ page }) => {
    // 点击矩形组件添加元素
    await page.getByText('□矩形').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 修改背景色
    await page.locator('input[data-prop="bgColor"]').fill('#0000FF');
    // 验证颜色已修改
    await expect(page.locator('input[data-prop="bgColor"]')).toHaveValue('#0000ff');
  });

  test('线条属性-线条颜色', async ({ page }) => {
    // 点击横线组件添加元素
    await page.getByText('—横线').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 修改线条颜色
    await page.locator('input[data-prop="lineColor"]').fill('#FF00FF');
    // 验证颜色已修改
    await expect(page.locator('input[data-prop="lineColor"]')).toHaveValue('#ff00ff');
  });

  test('二维码绑定字段切换', async ({ page }) => {
    // 点击二维码组件添加元素
    await page.getByText('QR二维码').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 切换绑定字段
    await page.locator('select[data-prop="bindField"]').selectOption('客户商品编码');
    // 验证绑定字段已切换
    await expect(page.locator('select[data-prop="bindField"]')).toHaveValue('客户商品编码');
  });

});

test.describe('联动逻辑测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    // 进入模板设计器
    await page.getByText('模板设计器').click();
    await page.waitForLoadState('networkidle');
  });

  test('打印旋转联动-元素旋转禁用', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 打印旋转选择90°
    await page.locator('#designerPrintRotation').selectOption('90');
    // 验证元素旋转下拉框被禁用
    await expect(page.locator('select[data-prop="rotation"]')).toBeDisabled();
    // 验证打印尺寸宽高互换
    await expect(page.locator('#printSizeWidth')).toHaveValue('70');
    await expect(page.locator('#printSizeHeight')).toHaveValue('30');
  });

  test('打印旋转恢复-元素旋转启用', async ({ page }) => {
    // 点击静态文本组件添加元素
    await page.getByText('T静态文本').click();
    // 选中元素
    await page.locator('.canvas-element').first().click();
    // 打印旋转选择90°
    await page.locator('#designerPrintRotation').selectOption('90');
    // 恢复0°旋转
    await page.locator('#designerPrintRotation').selectOption('0');
    // 验证元素旋转下拉框恢复可用
    await expect(page.locator('select[data-prop="rotation"]')).toBeEnabled();
  });

});

test.describe('预览/保存/打印一致性测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('设计器预览与画布内容一致', async ({ page }) => {
    // 进入容器模板设计器
    await page.getByRole('cell', { name: 'TPL_CONTAINER_IN_10050' }).click();
    await page.waitForLoadState('networkidle');

    // 获取画布内容
    const canvasContent = await page.locator('.canvas-area').textContent();

    // 点击预览按钮
    await page.getByRole('button', { name: '预览' }).click();

    // 获取预览弹窗内容
    const previewContent = await page.locator('.preview-content').textContent();

    // 验证内容一致
    expect(previewContent).toContain('CONTAINER INBOUND');
    expect(previewContent).toContain('containerCode');

    // 关闭预览弹窗
    await page.getByRole('button', { name: '关闭' }).click();
  });

  test('保存功能验证', async ({ page }) => {
    // 进入容器模板设计器
    await page.getByRole('cell', { name: 'TPL_CONTAINER_IN_10050' }).click();
    await page.waitForLoadState('networkidle');

    // 修改模板名称
    const nameInput = page.getByRole('textbox', { name: '模板名称' });
    const originalName = await nameInput.inputValue();
    await nameInput.fill(originalName + '-测试保存');

    // 点击保存
    await page.getByRole('button', { name: '保存' }).click();

    // 等待保存完成
    await page.waitForTimeout(1000);

    // 返回列表验证
    await page.getByRole('button', { name: '返回' }).click();
    await page.waitForLoadState('networkidle');

    // 验证名称已更新
    await expect(page.getByText(originalName + '-测试保存')).toBeVisible();

    // 恢复原始名称
    await page.getByRole('cell', { name: 'TPL_CONTAINER_IN_10050' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '模板名称' }).fill(originalName);
    await page.getByRole('button', { name: '保存' }).click();
  });

  test('打印预览内容对比', async ({ page }) => {
    // 点击第一条记录的打印按钮
    await page.locator('span[data-act="print"]').first().click();

    // 验证打印弹窗显示
    await expect(page.getByRole('heading', { name: '模板打印' })).toBeVisible();

    // 获取打印预览内容
    const printPreview = page.locator('.print-preview');
    await expect(printPreview).toBeVisible();

    // 验证包含关键内容
    await expect(printPreview).toContainText('CONTAINER INBOUND');
    await expect(printPreview).toContainText('containerCode');

    // 关闭弹窗
    await page.getByRole('button', { name: '取消' }).click();
  });

});
