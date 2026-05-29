# WMS 打印模板中心对话与修改交接文档

生成时间：2026-05-29  
项目目录：`/Users/l/Documents/Codex/wms-print-template-center`  
GitHub 仓库：`https://github.com/794280883-ops/Print_Template`  
当前分支：`main`  
最新提交：`7e92df9 feat: refine template designer and field dictionary`

> 说明：本文档用于给其他 AI 或开发者快速识别本轮对话目标、执行过的修改、当前项目状态和后续可继续处理的上下文。内容基于当前 Codex 会话可见上下文整理。

## 一、最初目标

用户要求使用 `wms-html-onlineization` skill，基于原单文件：

`/Users/l/Documents/Codex/2026-05-21/1-prd-wms-2-codex-pdf/AI自定义打印模版/wms-print-template-prototype.html`

按线上化计划分阶段执行：

1. 先把单 HTML 拆成前端工程
2. 再新增 Node.js 后端 API
3. 再设计 MySQL 表并迁移 mock 数据
4. 再用 API 替换 localStorage
5. 再补 Docker Compose、Nginx、`.env` 配置
6. 最后做服务器发布、鉴权、日志、备份和测试

随后用户明确第一阶段迁移计划：

- 新建项目：`/Users/l/Documents/Codex/wms-print-template-center/frontend`
- 技术路线：`Vite + Vanilla JavaScript`
- 保留原 UI、配色、布局、交互
- 第一阶段不接真实后端，不建库，不替换 API，只封装 API 层
- 原文件不修改
- 不复用旧 `wms-print-template-nextjs`

## 二、已完成阶段概览

### 1. 前端工程化

已从单 HTML 拆成 Vite 前端工程：

- `frontend/package.json`
- `frontend/index.html`
- `frontend/src/main.js`
- `frontend/src/app/WmsPrintTemplateApp.js`
- `frontend/src/styles/wms.css`
- `frontend/src/api/request.js`
- `frontend/src/api/templateApi.js`
- `frontend/src/data/constants.js`
- `frontend/src/data/mockData.js`
- `frontend/src/services/*`

页面模块按原计划拆分/组织为：

- 模板列表
- 模板设计器
- 标准模板库
- 字段字典
- 打印日志
- 业务打印模拟后来移动到模板列表操作列的“打印”按钮

### 2. 后端 API

已新增 Node.js 后端工程：

- Express API
- MySQL 连接
- 模板接口
- 字段字典接口
- 打印接口
- AI mock 生成接口
- 操作日志接口
- 健康检查接口

常用后端端口：`3001`

### 3. MySQL 与迁移

用户提供本地 MySQL：

- host：`127.0.0.1`
- port：`3306`
- user：`root`
- password：`123456`
- database：`wms_print_template`

已存在迁移脚本：

- `backend/migrations/001_init.sql`
- `backend/migrations/002_update_field_dict.sql`
- `backend/migrations/003_add_product_field_dict.sql`

迁移执行脚本：

- `backend/scripts/run-migration.js`

该脚本已改为按文件顺序执行所有 migration。

### 4. Git 与 GitHub

已初始化并推送到 GitHub：

仓库：

`git@github.com:794280883-ops/Print_Template.git`

当前最新提交：

```text
7e92df9 feat: refine template designer and field dictionary
```

GitHub SSH key 已配置：

```text
~/.ssh/id_ed25519_github_codex
```

SSH 验证账号：

```text
794280883-ops
```

## 三、用户后续需求与已实现修改

### 1. 字段字典树形菜单

用户要求在字段字典相关 API 左侧做树形菜单：

- `/api/v1/template/fields/location` 命名为“库位”
- `/api/v1/template/fields/container` 命名为“容器”
- 后续新增 `/api/v1/template/fields/product` 命名为“商品”

已实现字段字典树形分类展示。

### 2. 库位字段字典调整

接口：

`/api/v1/template/fields/location`

用户要求：

- `warehouseCode` 注释改为“区域仓编码”
- `warehouseCode` 改为必填
- `areaCode` 注释改为“物理仓编码”
- 去掉 `fullLocationName`

已实现并写入迁移。

### 3. 容器字段字典调整

接口：

`/api/v1/template/fields/container`

用户要求：

- 除 `containerCode` 字段外，旧字段都去掉
- 新增“区域仓”“物理仓”字段
- 字段名称与库位接口定义一致
- 区域仓必填
- 新增“用途”与“使用场景”字段

当前容器字段：

- `containerCode`：容器编码
- `warehouseCode`：区域仓编码，必填
- `areaCode`：物理仓编码
- `purpose`：用途
- `usageScene`：使用场景

### 4. 商品字段字典新增

接口：

`/api/v1/template/fields/product`

用户要求：

- 商品编码，必填
- 客户商品编码

已实现商品字段字典。

当前商品字段：

- `productCode`：商品编码，必填
- `customerProductCode`：客户商品编码

### 5. 模板类型与字段字典联动

用户要求：

- 模板列表、模板设计器去掉“适用区域仓”
- 新增模板时，模板类型新增“商品模板”
- 商品模板标签尺寸默认 `30*70`
- 设计器根据模板类型展示字段字典：
  - 库位模板展示 location 字段
  - 容器模板展示 container 字段
  - 商品模板展示 product 字段

已实现。

### 6. 业务打印模拟移动

用户要求：

- 将业务模拟打印功能移动到模板列表操作列
- 按钮命名为“打印”

已实现：

- 顶部导航去掉业务打印模拟入口
- 模板列表操作列新增“打印”
- 打印弹窗根据模板类型展示模拟数据
- 打印后生成打印日志

### 7. 模板列表字段调整

用户要求：

- 模板列表去掉“版本”
- 模板列表去掉“默认”
- 模板编码支持点击跳转设计器
- 模板列表操作列去掉“设计”按钮
- 操作需要增量记录模板设计日志

已实现：

- 点击模板编码进入对应模板设计器
- 设计按钮已去掉
- 设计相关操作会记录日志

### 8. 静态内容输入修复

用户反馈：

- 模板设计器中的静态内容输入后，无法填充到对应拖拽字段中
- 需要输入静态内容后，画布对应字段立即变化

已修复：

- 静态内容输入后直接更新选中组件
- 对动态字段切换为静态文本时也能正确展示输入内容
- 避免输入时整页刷新导致内容回退

### 9. 模板名称编辑与落库

用户要求：

- 模板设计器中的模板名称支持编辑
- 编辑后需要落库

已实现：

前端：

- 设计器顶部模板名称可编辑
- blur 后调用 API 保存

后端：

- 新增模板名称更新 API
- repository/service/controller/route 已补齐
- 编辑名称会记录操作日志

相关 API：

```http
PATCH /api/v1/templates/:id/name
```

### 10. 校验逻辑调整

用户要求：

- 模板设计器校验结果中，警告内容不需要校验非必填字段

已实现：

- 非必填字段不再作为警告提示
- 仍保留必要的错误校验，例如动态字段未绑定、字段不存在、元素超出画布等

### 11. 字段字典展示名称优化

用户要求：

- 模板设计器左侧字段字典无需显示编码，只显示名称
- 属性区“绑定字段”下拉也无需显示编码，只显示名称

已实现：

- 左侧字段字典只显示中文名称
- 属性区绑定字段下拉只显示中文名称
- value 仍使用字段编码，保证后端和 DSL 正常工作

### 12. 标签尺寸功能移动到设计器

用户要求：

- 模板列表尺寸列标注“宽 × 长”
- 模板列表中去掉标签尺寸编辑相关功能
- 标签尺寸相关信息移动到模板设计器中编辑
- 模板列表导入 JSON 按钮去掉
- 模板列表 AI 生成模板按钮去掉
- 模板列表操作列导出按钮去掉
- 导入、导出、AI 生成统一从模板设计器中使用

已实现。

### 13. 模板设计器版本号去掉

用户要求：

- 模板设计器顶部去掉版本号显示，例如 `. V0`

已实现。

### 14. 模板尺寸单位固定

用户要求：

- 模板尺寸单位默认为 `MM`
- 只显示且不可选

已实现：

- 设计器尺寸单位固定显示为 `mm`
- 不再提供单位下拉选择
- 保存草稿时强制 `unit: "mm"`

### 15. 复选框组件

用户要求：

- 组件区新增“复选框”按钮
- 暂时不需要绑定字段
- 支持选中/取消选中
- 后续追加：复选框支持固定文字

已实现：

- 组件区新增“复选框”
- 属性区支持勾选/取消
- 属性区支持固定文字
- 画布显示复选框和固定文字
- 后端 DSL 支持 `checkbox` 类型

### 16. 图片占位与矩形背景色

用户要求：

- 组件区图片占位先去掉
- 矩形支持设置背景色

已实现：

- 组件区已不再展示图片占位按钮
- 旧模板中图片类型仍兼容
- 矩形组件支持背景色设置
- 默认矩形背景色为浅蓝

### 17. 发布失败修复

用户反馈：

- 模板列表与设计器发布模板编码 `TPL_LOCATION_10050` 时提示“存在错误无法发布”
- 点击校验显示校验通过

原因：

- 后端旧进程/旧 DSL 校验还不支持新增的组件类型，例如 `checkbox`
- 前端校验和后端校验出现不一致

已修复：

- 后端 DSL 支持 `checkbox`
- 重启后端服务
- 已验证 `TPL_LOCATION_10050` 可以发布

### 18. 一维码/二维码属性区精简

用户要求：

1. 选择一维码、二维码时，属性区去掉“显示文本”选项
2. 询问“容器等级是什么意思”
3. 后续要求一维码、二维码都去掉“容错等级”，默认 `M`

解释：

- “显示文本”是旧 DSL 预留字段，当前画布渲染未使用，所以选择是/否无效
- “容错等级”实际是二维码纠错等级，不是容器等级
- 现在按用户要求不再暴露该选项

已实现：

- 一维码/二维码属性区去掉“显示文本”
- 一维码/二维码属性区去掉“容错等级”
- 新增一维码/二维码组件默认带 `errorLevel: "M"`

## 四、当前主要文件变更

最新提交 `7e92df9` 变更摘要：

```text
backend/migrations/001_init.sql                    |  24 +-
backend/migrations/002_update_field_dict.sql       |  89 ++++++
backend/migrations/003_add_product_field_dict.sql  |  13 +
backend/scripts/run-migration.js                   |  12 +-
backend/src/controllers/templateController.js      |  12 +
backend/src/repositories/operationLogRepository.js |  11 +
backend/src/repositories/templateRepository.js     |   5 +
backend/src/routes/template.routes.js              |   3 +
backend/src/services/aiService.js                  |  23 +-
backend/src/services/templateService.js            |  30 ++
backend/src/utils/dsl.js                           |   4 +-
frontend/index.html                                |   4 -
frontend/src/api/templateApi.js                    |  15 +
frontend/src/app/WmsPrintTemplateApp.js            | 316 +++++++++++++++------
frontend/src/data/constants.js                     |  31 +-
frontend/src/data/mockData.js                      |  20 +-
frontend/src/services/aiTemplateService.js         |  39 ++-
frontend/src/services/validationService.js         |   5 +-
frontend/src/styles/wms.css                        | 151 +++++++++-
```

## 五、本地运行方式

### 前端

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/frontend
npm install
npm run dev
```

默认访问：

`http://127.0.0.1:5173`

当前本机通常用 screen 启动：

```bash
screen -dmS wms-frontend zsh -lc 'cd /Users/l/Documents/Codex/wms-print-template-center/frontend && ./node_modules/.bin/vite --host 127.0.0.1'
```

### 后端

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
npm install
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASSWORD=123456 DB_NAME=wms_print_template node src/server.js
```

默认后端：

`http://127.0.0.1:3001`

### 迁移

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASSWORD=123456 DB_NAME=wms_print_template node scripts/run-migration.js
```

## 六、测试与验证

前端构建：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/frontend
npm run build
```

已通过。

后端测试：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
npm test
```

已通过。

后端数据库联调测试可用：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
RUN_DB_TESTS=1 DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASSWORD=123456 DB_NAME=wms_print_template npm test
```

之前已通过。

## 七、重要 API 列表

模板相关：

```http
GET    /api/v1/templates
GET    /api/v1/templates/:id
POST   /api/v1/templates
PUT    /api/v1/templates/:id
PATCH  /api/v1/templates/:id/name
POST   /api/v1/templates/:id/publish
POST   /api/v1/templates/:id/disable
POST   /api/v1/templates/:id/copy
POST   /api/v1/templates/import
GET    /api/v1/templates/:id/export
```

字段字典：

```http
GET /api/v1/template/fields/location
GET /api/v1/template/fields/container
GET /api/v1/template/fields/product
```

打印：

```http
POST /api/v1/print/preview
POST /api/v1/print/submit
GET  /api/v1/print/logs
```

AI mock：

```http
POST /api/v1/ai/templates/generate
```

日志：

```http
GET /api/v1/operation-logs
```

## 八、当前注意事项

1. 用户习惯用“模版”表达，项目 UI 里多处仍是“模板”，目前未统一替换。
2. 字段下拉展示中文名称，但内部 DSL 仍保存字段编码。
3. 一维码/二维码的 `errorLevel` 不在 UI 中展示，新增组件默认保存为 `M`。
4. `image` 类型从组件区移除，但后端和渲染仍兼容旧模板。
5. 复选框不绑定字段，仅支持固定文字、选中状态和样式。
6. 发布前端校验与后端 DSL 校验需要继续保持同步。
7. 如果再次出现发布校验不一致，优先检查后端进程是否旧版本未重启。
8. 最新修改已推送到 GitHub `origin/main`。

## 九、给后续 AI 的建议

如果继续开发，优先从这些文件入手：

- 前端主逻辑：`frontend/src/app/WmsPrintTemplateApp.js`
- 字段/组件常量：`frontend/src/data/constants.js`
- 前端 API 封装：`frontend/src/api/templateApi.js`
- 前端 DSL 校验：`frontend/src/services/validationService.js`
- 后端 DSL 校验：`backend/src/utils/dsl.js`
- 模板后端服务：`backend/src/services/templateService.js`
- 模板后端路由：`backend/src/routes/template.routes.js`
- 字段迁移：`backend/migrations/*.sql`

继续修改时建议每次完成后执行：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/frontend && npm run build
cd /Users/l/Documents/Codex/wms-print-template-center/backend && npm test
```

如涉及数据库：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
RUN_DB_TESTS=1 DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASSWORD=123456 DB_NAME=wms_print_template npm test
```

