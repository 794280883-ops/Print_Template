---
name: wms-print-template-center-agent
description: >
  WMS 打印模板中心项目的 Agent 行为规则。定义执行范围、架构约束、代码风格、文档同步规则和确认流程。
  当 Agent 在此项目中修改代码或执行任务时加载。
  触发词：修改代码、新增功能、项目规则、wms-print-template-center、打印模板、业务数据
---

# 项目级协作规则

本项目默认按"低消耗、最小范围、最小验证"原则协作。

---

## 首次进入项目必读

Agent 首次进入本项目时，按以下顺序建立上下文：

1. **本文件** — 了解行为规则和架构约束
2. `README.md` — 了解项目整体结构和技术栈
3. `docs/数据库设计.md` — 理解核心数据模型（`business_record` 统一表 + 运行时 Schema 编译）
4. `docs/功能清单.md` — 了解系统能力范围
5. `docs/接口文档.md` — 了解已有 API 端点

---

## 快速启动

```bash
# 1. 启动 MySQL（Docker Desktop 需先运行）
docker start mysql

# 2. 启动前后端（自动执行数据库迁移）
cd /Users/l/Documents/Wms_Print/wms-print-template-center
./scripts/dev-local.sh

# 3. 访问
# 前端：http://127.0.0.1:5173
# 后端健康检查：http://127.0.0.1:3001/api/v1/health
# MySQL：127.0.0.1:3306
```

执行 `dev-local.sh` 后，脚本会自动：检查 MySQL 连通性 → 执行数据库迁移 → 启动后端（`node --watch` 热重载）→ 启动前端（Vite HMR）。Ctrl+C 停止前后端，MySQL 容器保持运行。

---

## 常见错误处理

| 场景 | 处理方式 |
|------|---------|
| `./scripts/dev-local.sh` 报 "MySQL not reachable" | `docker start mysql`，等待 10 秒重试；若容器不存在则 `docker-compose up -d mysql` |
| `npm run migrate` 失败 | 检查 MySQL 是否启动、`.env` 中 `DB_PASSWORD` 是否正确 |
| `npm run dev` 端口占用 (3001/5173) | `lsof -ti:3001 -ti:5173 \| xargs kill` 释放端口后重试 |
| 前端白屏/API 502 | 确认后端已启动 → 检查浏览器控制台 Network 面板 → 确认 `VITE_API_BASE_URL` 配置 |
| Docker Desktop 未启动 | `open -a "Docker Desktop"`，等待菜单栏图标稳定后再执行 |
| 找不到 `.env` 文件 | `cp .env.example .env` 后根据本地环境修改 |
| `npm install` 报错 | 确认 Node.js ≥22，`node --version` 检查版本 |

---

## 一、执行范围

- 一次只处理一个明确问题。
- 默认只处理用户明确指定的页面、接口、模块、文件或功能点。
- 不主动扩展范围，不顺手修复无关问题。

---

## 二、默认执行方式

### 2.1 通用原则
- 默认先做代码排查和最小修复，不做全量回归。
- 默认不做浏览器联调、不做截图核对、不做 PDF 渲染检查，除非用户明确要求。
- 默认不做构建，除非改动影响打包、发布产物，或用户明确要求。
- 默认不读取大量无关文件，只查看完成当前任务所必需的文件。
- **不自动提交 git、不自动推送**，仅在用户明确要求时才执行。
- **发现范围外问题时**，只说明风险和建议，不直接修改。
- **需要扩大范围、增加验证、联调页面、生成打印产物时**，先征求用户确认。
- **修改涉及 DSL 校验逻辑时**，主动提醒用户需同步前后端。

### 2.2 测试范围匹配

| 变更范围 | 应执行的测试 |
|---------|------------|
| 修改后端 service/repository | `backend/tests/` 中对应测试 |
| 修改前端组件/页面 | `frontend/tests/` 中对应测试 |
| 修改 DSL 校验逻辑 | `dslParity.test.js`（前后端一致性） |
| 修改 API 端点 | `backend/tests/api.test.js` |
| 未涉及上述范围 | 可跳过测试 |

### 2.3 确认格式模板

当需要征求用户确认时，使用以下格式：

```
📋 确认事项：
- 将修改的文件：[文件列表]
- 影响范围：[简述]
- 风险点：[如有]

是否继续？
```

等待用户明确回复"确认"/"继续"/"可以"后再执行，不自行推断。

### 2.4 测试数据清理
- 在本地环境执行测试或手动验证后，必须清理本次验证产生的测试数据。
- **本项目测试数据包括**：`business_record` 表中导入的测试行、`print_template` 中创建的测试模板、`print_business_module` 中创建的测试模块、`print_field_dict` 中创建的测试字段、`sys_user` 中创建的测试用户/角色。
- **不清理的内容**：已有种子数据（admin 用户、默认角色、默认菜单、LOCATION/CONTAINER/PRODUCT 默认模块及字段）、用户既有业务数据。
- **禁止操作**：不得修改或删除任何既有的生产/本地开发数据（如已有的业务记录、模板、模块配置）。

---

## 三、项目架构约束（必须遵循）

### 架构速查表

| 约束 | 核心规则 | 违例案例 |
|------|---------|---------|
| 三层架构 | route → controller → service → repository，不可越级 | 在 route 中直接写 SQL |
| Schema 编译 | 新增模块不改代码，改"模版字段"页面 | 为每个模块写独立 CRUD |
| DSL 一致性 | 改规则必须同步 `backend/src/utils/` + `frontend/src/services/` | 只改一端 |
| RBAC 权限 | 新页面 = 迁移 + 路由meta + v-permission，三项缺一不可 | 新页面不加权限码 |
| 数据库变更 | 只通过 `migrations/00X_*.sql` 改库 | 手动执行 ALTER TABLE |

### 3.1 后端三层架构
修改或新增后端功能时，**严格遵循** controller → service → repository 分层：

```
routes/      → 只做路由注册 + 中间件挂载，不写业务逻辑
controllers/ → 请求参数提取、调用 service、格式化响应
services/    → 业务逻辑，可调用 repository 和 utils
repositories/→ 仅做数据库 CRUD（原生 SQL），不包含业务逻辑
config/      → 数据库连接 + 环境变量读取
middlewares/  → auth（JWT + 权限校验）、errorHandler（统一错误处理）、asyncHandler
```

- 不要在 route 或 controller 中直接操作数据库。
- 不要在 repository 中加入业务判断逻辑。
- 异步路由处理必须使用 `asyncHandler` 中间件包裹。

### 3.2 运行时 Schema 编译（核心设计）
- 所有业务数据统一存储在 `business_record` 表，字段 schema 由 `print_field_dict` + `print_business_module` 在运行时动态编译。
- **新增业务模块不需要修改后端代码**，在"模版字段"页面操作即可。
- 如果需要修改 schema 编译逻辑，只改 `backend/src/services/schemaService.js`。

### 3.3 DSL 校验——前后端必须一致
- 模板的 DSL 校验逻辑在前后端各有一份实现：
  - 后端：`backend/src/utils/` 中的 DSL 校验工具
  - 前端：`frontend/src/services/` 中的校验服务
- **修改 DSL 校验规则时，必须同步更新前后端两处代码**，否则会出现"保存成功但启用失败"的情况。
- 修改后运行 `dslParity.test.js` 验证前后端一致性。

### 3.4 RBAC 权限体系
- 系统采用用户 → 角色 → 菜单(权限码) 的五表 RBAC 模型，完整说明见 [权限系统开发规范](docs/权限系统开发规范.md)。
- **新增页面时，必须同步添加三项**：迁移文件中追加菜单种子记录、前端路由注册（带 `meta.permission`）、按钮使用 `v-permission` 指令或 `v-if + hasPermission()` 控制。
- **注意**：`<a-popconfirm>` 和 `<a-tooltip>` 等 Ant Design 包裹组件的 v-permission 限制见 [权限系统开发规范 - v-permission 正确用法](docs/权限系统开发规范.md)。
- 权限变更后需要用户重新登录才能生效。

### 3.5 数据库变更——迁移文件
- 所有数据库结构变更必须通过编号 SQL 迁移文件管理，不能直接手动改库。
- 迁移文件命名：`backend/migrations/00X_descriptive_name.sql`（如 `003_drop_business_record_unique.sql`）。
- 新增迁移后，需更新 `docs/数据库设计.md` 中的迁移文件列表和对应表结构。
- 迁移按编号顺序执行，由 `npm run migrate` 或 `dev-local.sh` 自动触发。

---

## 四、代码风格约束

### 4.1 Vue 前端
- 统一使用 `<script setup>` + Composition API。
- 状态管理使用 Pinia（`frontend/src/stores/`），不通过 provide/inject 传递跨组件状态。
- API 请求通过 `frontend/src/api/` 中的封装函数，不在组件中直接使用 fetch/axios。
- 布局使用已有的 `AppLayout.vue` 或 `LoginLayout.vue`，不随意新建布局。

### 4.2 文件组织
- 禁止将图片/视频/二进制文件放在项目根目录。
- 测试截图放在对应 `tests/` 目录，按步骤顺序命名（如 `step1-login.png`）。
- 定期清理不再需要的临时测试文件。

---

## 五、文档同步规则

代码修改后，按以下映射更新对应文档：

| 变更类型 | 需更新的文档 | 频率 |
|----------|-------------|------|
| 新增/修改 API 端点 | `docs/接口文档.md` | ⚠️ 高频 |
| 数据库表结构/字段变更 | `docs/数据库设计.md` + 新增 migration 文件 | ⚠️ 高频 |
| 新增业务模块/字段/模板类型 | `docs/功能清单.md` + `README.md` 字段映射参考 | 中频 |
| 环境变量新增/修改 | `docs/环境变量说明.md` + 对应 `.env.example` 文件 | 低频 |
| 新增页面/按钮/权限码 | `docs/权限系统开发规范.md` + `docs/功能清单.md` | ⚠️ 高频 |
| 部署流程变更 | `docs/服务器部署指南.md` | 低频 |
| 业务流程变更 | `docs/系统流程.md` | 低频 |
| 测试结构/方式变更 | `docs/测试指南.md` | 低频 |
| 架构变更 | `docs/项目架构总览.md` + `docs/后端服务层说明.md` | 低频 |
| 用户可见的功能变更 | `docs/用户操作手册.md` | 中频 |

提交前使用 `docs/提交前文档检查清单.md` 逐项核对，确保所有变更已同步到文档。
高频项（⚠️）优先检查，确保不遗漏。

---

## 六、用户优先级

- 如果用户在本次任务中明确要求更高强度的验证、更大范围的修改或端到端检查，以用户要求为准。
- 用户明确要求的操作（如浏览器联调、完整回归测试、构建部署）不受"默认执行方式"约束。
