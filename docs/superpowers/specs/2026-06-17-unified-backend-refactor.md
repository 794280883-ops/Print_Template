# 统一后端平台 — 全量重构设计

> 2026-06-17 | 一步到位，不保留旧代码兼容

## 目标

将 container / location / product / business_data 四张表统一为 `business_record` 单表，消除 `businessDataMapping.js` 硬编码映射，全部改为运行时 schema 驱动。

## 数据库变更

### 新增

```sql
CREATE TABLE business_record (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_code VARCHAR(32) NOT NULL,
  record_code VARCHAR(128) NOT NULL,
  record_data JSON NOT NULL,
  search_text TEXT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_module_record (module_code, record_code),
  INDEX idx_module_code (module_code)
);
```

### 修改

```sql
-- print_business_module 语义对齐
ALTER TABLE print_business_module
  CHANGE COLUMN code_field record_code_field VARCHAR(64) NOT NULL;

-- print_field_dict 改为 module_code + 运行时属性
ALTER TABLE print_field_dict
  CHANGE COLUMN template_type module_code VARCHAR(32) NOT NULL,
  ADD COLUMN searchable TINYINT DEFAULT 0,
  ADD COLUMN sortable TINYINT DEFAULT 0,
  ADD COLUMN bindable_in_template TINYINT DEFAULT 1;
```

### 删除

```sql
DROP TABLE IF EXISTS container;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS business_data;
```

### 种子数据

LOCATION / CONTAINER / PRODUCT 的字段字典数据更新 `module_code` 列名，三个模块的 `print_business_module` 记录保持不变。

### 迁移策略

删除全部 16 个旧 migration 文件，新建单一 `001_init.sql` 包含完整 schema + 种子数据。后续增量迁移从 002 开始编号。

## 后端代码变更

### 删除（3 文件）

| 文件 | 原因 |
|------|------|
| `config/businessDataMapping.js` | 硬编码映射，由 schemaService 替代 |
| `repositories/businessDataRepository.js` | 288 行双路径，由 recordRepository 替代 |
| `services/businessDataService.js` | 由 recordService 替代 |

### 新增（3 文件）

| 文件 | 职责 |
|------|------|
| `services/schemaService.js` | `compileSchema(moduleCode)` → 返回 module + fields + recordCodeField + searchable/sortable/bindable 分组 |
| `repositories/recordRepository.js` | `search/create/update/remove` 统一 CRUD，单一路径 |
| `services/recordService.js` | 业务校验 + 调用 recordRepository |

### 修改

| 文件 | 变更 |
|------|------|
| `controllers/businessDataController.js` | types/search/create/update/remove/import 全部调用 recordService |
| `routes/businessData.routes.js` | 路由路径不变，controller 方法名可能微调 |
| `services/fieldService.js` | `templateType` → `moduleCode` |
| `repositories/fieldRepository.js` | 同上 |
| `services/templateService.js` | 字段校验从 `businessDataMapping` 切到 `schemaService` |
| `services/businessModuleService.js` | `codeField` → `recordCodeField` |
| `controllers/businessModuleController.js` | 同上 |

### API 兼容

所有对外 API 路径不变：
```
GET    /business-data/search
GET    /business-data/types
GET    /business-data/template/:bizType
POST   /business-data
PUT    /business-data/:bizType/:bizCode
DELETE /business-data/:bizType/:bizCode
POST   /business-data/import/:bizType
GET    /template/fields/:moduleCode
```

内部 `:bizType` 参数即 `module_code`，语义一致。

## 前端变更

无需改 UI。仅确认 `api/businessDataApi.js` 中 URL 路径与后端一致即可。

## 数据迁移

不迁移旧数据。container / location / product / business_data 全部删除，测试数据通过导入功能重新录入。

## 验证

1. `npm run migrate` → 新 001_init.sql 执行成功
2. `curl /api/v1/health` → `{"service":"ok","database":"ok"}`
3. `curl /api/v1/template/fields/LOCATION` → 返回字段列表
4. `curl /api/v1/business-data/search?bizType=LOCATION` → 空列表（无数据）
5. 通过导入功能导入 LOCATION 数据 → 列表可查
6. `curl /api/v1/business-modules` → LOCATION/CONTAINER/PRODUCT 三个模块
7. 模板设计器绑定字段 → 字段列表正常
8. 前端 `http://127.0.0.1:5173` 业务数据页 CRUD 正常
