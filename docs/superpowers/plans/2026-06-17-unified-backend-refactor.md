# Unified Backend Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge container/location/product/business_data into a single `business_record` table and replace hardcoded `businessDataMapping.js` with a runtime schema compiler.

**Architecture:** `schemaService.compileSchema(moduleCode)` reads `print_business_module` + `print_field_dict` at runtime, returning a typed schema object consumed by `recordRepository` and `recordService`. All business data CRUD flows through `business_record.record_data JSON`. Old hardcoded mapping and per-type tables are deleted entirely.

**Tech Stack:** Node.js, Express, MySQL (mysql2), XLSX

---

### File Map

| Action | File | Role |
|--------|------|------|
| Delete | `backend/migrations/001–016_*.sql` (16 files) | Old incremental migrations |
| Create | `backend/migrations/001_init.sql` | Single-file schema + seeds |
| Delete | `backend/src/config/businessDataMapping.js` | Hardcoded table-column mapping |
| Delete | `backend/src/repositories/businessDataRepository.js` | Dual-path CRUD (288 lines) |
| Delete | `backend/src/services/businessDataService.js` | Orchestration + import/export (254 lines) |
| Create | `backend/src/services/schemaService.js` | Runtime schema compiler |
| Create | `backend/src/repositories/recordRepository.js` | Unified CRUD against business_record |
| Create | `backend/src/services/recordService.js` | Business logic + import/export |
| Modify | `backend/src/controllers/businessDataController.js` | Route to recordService |
| Modify | `backend/src/repositories/fieldRepository.js` | `template_type` → `module_code` |
| Modify | `backend/src/repositories/businessModuleRepository.js` | `code_field` → `record_code_field` |
| Modify | `backend/src/services/businessModuleService.js` | `codeField` → `recordCodeField` |
| Modify | `backend/src/services/fieldService.js` | Column renames |
| Modify | `backend/src/controllers/businessModuleController.js` | Field name align |
| Check | `frontend/src/api/businessDataApi.js` | Verify URL paths unchanged |

---

### Task 1: Delete old migrations and create 001_init.sql

**Files:**
- Delete: `backend/migrations/001_init.sql` through `016_drop_unused_indexes.sql` (all 16)
- Create: `backend/migrations/001_init.sql`

- [ ] **Step 1: Delete old migration files**

```bash
rm backend/migrations/*.sql
```

- [ ] **Step 2: Write 001_init.sql**

```sql
-- ============================================================
-- 001_init.sql — 统一后端平台完整 schema + 种子数据
-- ============================================================

-- 1. 模板
CREATE TABLE IF NOT EXISTS print_template (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_code VARCHAR(64) NOT NULL UNIQUE,
  template_name VARCHAR(128) NOT NULL,
  template_type VARCHAR(32) NOT NULL,
  width_mm DECIMAL(10,2) NOT NULL,
  height_mm DECIMAL(10,2) NOT NULL,
  unit VARCHAR(16) NOT NULL DEFAULT 'mm',
  dpi INT NOT NULL DEFAULT 203,
  print_rotation INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'disabled',
  remark VARCHAR(512),
  field_preview_values JSON,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_template_type_status (template_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 模板元素
CREATE TABLE IF NOT EXISTS print_template_element (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL,
  element_uid VARCHAR(64) NOT NULL,
  element_type VARCHAR(32) NOT NULL,
  x DECIMAL(10,2) NOT NULL,
  y DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  z_index INT DEFAULT 1,
  rotate INT DEFAULT 0,
  text_kind VARCHAR(32),
  text_content VARCHAR(512),
  bind_field VARCHAR(128),
  font_size INT,
  bold TINYINT(1) DEFAULT 0,
  align_type VARCHAR(32),
  color VARCHAR(64),
  background_color VARCHAR(64),
  extra_json JSON,
  UNIQUE KEY uk_template_element_uid (template_id, element_uid),
  CONSTRAINT fk_template_element_template FOREIGN KEY (template_id) REFERENCES print_template(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 模板字段字典
CREATE TABLE IF NOT EXISTS print_field_dict (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_code VARCHAR(32) NOT NULL,
  field_code VARCHAR(128) NOT NULL,
  field_name VARCHAR(128) NOT NULL,
  field_type VARCHAR(32) NOT NULL DEFAULT 'string',
  example_value VARCHAR(512),
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(512),
  sort_no INT DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  searchable TINYINT DEFAULT 0,
  sortable TINYINT DEFAULT 0,
  bindable_in_template TINYINT DEFAULT 1,
  UNIQUE KEY uk_type_field (module_code, field_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 打印日志
CREATE TABLE IF NOT EXISTS print_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT,
  template_code VARCHAR(64),
  business_type VARCHAR(32),
  business_no VARCHAR(128),
  warehouse_code VARCHAR(64),
  print_payload JSON,
  print_status VARCHAR(32) NOT NULL,
  error_message VARCHAR(1024),
  operator VARCHAR(64),
  printed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 操作日志
CREATE TABLE IF NOT EXISTS operation_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_name VARCHAR(64) NOT NULL,
  action_name VARCHAR(64) NOT NULL,
  target_type VARCHAR(64),
  target_id VARCHAR(64),
  target_name VARCHAR(128),
  before_json JSON,
  after_json JSON,
  operator VARCHAR(64),
  operated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 业务模块
CREATE TABLE IF NOT EXISTS print_business_module (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_code VARCHAR(32) NOT NULL,
  module_name VARCHAR(128) NOT NULL,
  template_label VARCHAR(128) NOT NULL,
  data_label VARCHAR(128) NOT NULL,
  record_code_field VARCHAR(64) NOT NULL,
  storage_mode VARCHAR(32) NOT NULL DEFAULT 'json_table',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_no INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_module_code (module_code),
  INDEX idx_enabled_sort (enabled, sort_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 业务记录（统一表）
CREATE TABLE IF NOT EXISTS business_record (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 种子数据 ==========

-- 业务模块
INSERT INTO print_business_module
  (module_code, module_name, template_label, data_label, record_code_field, storage_mode, enabled, sort_no)
VALUES
  ('LOCATION', '库位', '库位模板', '库位数据', 'locationCode', 'json_table', 1, 10),
  ('CONTAINER', '容器', '容器模板', '容器数据', 'containerCode', 'json_table', 1, 20),
  ('PRODUCT', '商品', '商品模板', '商品数据', 'productCode', 'json_table', 1, 30)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  template_label = VALUES(template_label),
  data_label = VALUES(data_label),
  record_code_field = VALUES(record_code_field),
  storage_mode = VALUES(storage_mode),
  enabled = VALUES(enabled),
  sort_no = VALUES(sort_no);

-- 字段字典
INSERT INTO print_field_dict
  (module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, searchable, sortable)
VALUES
  ('LOCATION','locationCode','库位编码','string','DD1801-004A',1,'库位唯一标识编码',10,1,1),
  ('LOCATION','locationPrefix','库位前缀','string','TZ',0,'库位编码前缀',20,1,1),
  ('LOCATION','row','排','string','12',0,'货架排号',30,0,0),
  ('LOCATION','column','列','string','89',0,'货架列号',40,0,0),
  ('LOCATION','level','层','string','B1',0,'货架层级标识',50,0,0),
  ('LOCATION','directionMark','方向标','string','↑',0,'方向指示符',60,0,0),
  ('LOCATION','warehouseCode','区域仓编码','string','JP-TYO-01',1,'区域仓编码',70,1,1),
  ('LOCATION','areaCode','物理仓编码','string','JP01',0,'物理仓编码',80,1,1),
  ('CONTAINER','containerCode','容器编码','string','C2P0001',1,'容器编码',10,1,1),
  ('CONTAINER','warehouseCode','区域仓编码','string','JP-TYO-01',0,'区域仓编码',20,1,1),
  ('CONTAINER','areaCode','物理仓编码','string','JP01',0,'物理仓编码',30,1,1),
  ('PRODUCT','productCode','商品编码','string','SKU-10001',1,'商品编码',10,1,1),
  ('PRODUCT','ProductBarcode','商品条码','string','TM001',0,'商品条码',15,1,1),
  ('PRODUCT','customerProductCode','客户商品编码','string','CUST-SKU-10001',0,'客户商品编码',20,1,1)
ON DUPLICATE KEY UPDATE
  field_name = VALUES(field_name), field_type = VALUES(field_type),
  example_value = VALUES(example_value), is_required = VALUES(is_required),
  description = VALUES(description), sort_no = VALUES(sort_no),
  searchable = VALUES(searchable), sortable = VALUES(sortable);

-- 预置模板
INSERT IGNORE INTO print_template
  (id, template_code, template_name, template_type, width_mm, height_mm, unit, dpi, status, remark)
VALUES
  (1,'TPL_LOCATION_10050','库位标签-100x50','LOCATION',100,50,'mm',203,'enabled','标准库位大标签'),
  (2,'TPL_CONTAINER_IN_10050','容器入库标签-100x50','CONTAINER',100,50,'mm',203,'enabled','入库容器标签'),
  (3,'TPL_PICKING_100150','拣货容器标签-100x150','CONTAINER',100,150,'mm',203,'disabled','长版拣货容器标签');

INSERT IGNORE INTO print_template_element
  (template_id, element_uid, element_type, x, y, width, height, z_index, rotate, text_kind, text_content, bind_field, font_size, bold, align_type, color, background_color, extra_json)
VALUES
  (1,'text_location_code','text',14,5,72,11,1,0,'field',NULL,'locationCode',28,1,'center','#111827','transparent',JSON_OBJECT()),
  (1,'qr_location_code','qrcode',8,23,20,20,2,0,NULL,NULL,'locationCode',NULL,0,NULL,NULL,NULL,JSON_OBJECT()),
  (1,'text_prefix','text',8,6,14,7,3,0,'field',NULL,'locationPrefix',12,1,'left','#111827','transparent',JSON_OBJECT()),
  (1,'text_direction','text',64,24,26,14,4,0,'field',NULL,'directionMark',24,1,'center','#ffffff','#111827',JSON_OBJECT()),
  (2,'title_inbound','text',6,4,88,8,1,0,'static','CONTAINER INBOUND',NULL,16,1,'center','#111827','transparent',JSON_OBJECT()),
  (2,'container_code','text',8,14,58,10,2,0,'field',NULL,'containerCode',22,1,'left','#111827','transparent',JSON_OBJECT()),
  (2,'container_qr','qrcode',72,14,20,20,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,JSON_OBJECT()),
  (2,'container_warehouse','text',8,30,32,7,4,0,'field',NULL,'warehouseCode',10,0,'left','#111827','transparent',JSON_OBJECT()),
  (2,'container_area','text',8,39,55,6,5,0,'field',NULL,'areaCode',8,0,'left','#334155','transparent',JSON_OBJECT()),
  (3,'picking_title','text',7,8,86,10,1,0,'static','PICKING CONTAINER',NULL,18,1,'center','#111827','transparent',JSON_OBJECT()),
  (3,'picking_code','text',12,28,76,14,2,0,'field',NULL,'containerCode',28,1,'center','#111827','transparent',JSON_OBJECT()),
  (3,'picking_barcode','barcode',12,48,76,22,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,JSON_OBJECT());
```

- [ ] **Step 3: Run migration**

```bash
cd backend && ENV_FILE=../.env npm run migrate
```

Expected: `Applied 001_init.sql`, `Migration completed for database wms_print_template`

- [ ] **Step 4: Commit**

```bash
git add backend/migrations/
git commit -m "feat: unified 001_init.sql replaces 16 incremental migrations"
```

---

### Task 2: Delete hardcoded mapping and old data layer

**Files:**
- Delete: `backend/src/config/businessDataMapping.js`
- Delete: `backend/src/repositories/businessDataRepository.js`
- Delete: `backend/src/services/businessDataService.js`

- [ ] **Step 1: Delete files**

```bash
rm backend/src/config/businessDataMapping.js
rm backend/src/repositories/businessDataRepository.js
rm backend/src/services/businessDataService.js
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/
git commit -m "feat: remove hardcoded mapping and dual-path repository"
```

---

### Task 3: Create schemaService.js

**Files:**
- Create: `backend/src/services/schemaService.js`

- [ ] **Step 1: Write schemaService.js**

```js
import * as businessModuleRepository from "../repositories/businessModuleRepository.js";
import * as fieldRepository from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";

export async function compileSchema(moduleCode) {
  const code = String(moduleCode || "").toUpperCase();
  const module = await businessModuleRepository.getModule(code);
  if (!module || !module.enabled) throw appError(`业务模块不存在或已停用：${moduleCode}`, 40000, 400);

  const rows = await fieldRepository.listFields(code);
  const fields = rows.filter(r => r.enabled).map(r => ({
    code: r.field_code,
    name: r.field_name,
    type: r.field_type,
    required: Boolean(r.is_required),
    sortNo: Number(r.sort_no || 0),
    searchable: Boolean(r.searchable),
    sortable: Boolean(r.sortable),
    bindableInTemplate: r.bindable_in_template !== 0,
  }));

  const recordCodeField = fields.find(f => f.code === module.record_code_field);
  if (!recordCodeField) throw appError(`模块 ${code} 的主编码字段不存在`, 50000, 500);

  return {
    module: {
      code: module.module_code,
      name: module.module_name,
      label: module.data_label,
      recordCodeField: module.record_code_field,
    },
    fields,
    recordCodeField,
    searchableFields: fields.filter(f => f.searchable),
    sortableFields: fields.filter(f => f.sortable),
    bindableFields: fields.filter(f => f.bindableInTemplate),
  };
}

export async function listModuleSchemas() {
  const modules = await businessModuleRepository.listEnabledModules();
  return modules.map(m => ({
    code: m.module_code,
    name: m.module_name,
    label: m.data_label,
    recordCodeField: m.record_code_field,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/schemaService.js
git commit -m "feat: add schemaService — runtime schema compiler"
```

---

### Task 4: Create recordRepository.js

**Files:**
- Create: `backend/src/repositories/recordRepository.js`

- [ ] **Step 1: Write recordRepository.js**

```js
import { pool } from "../config/db.js";

function quote(identifier) {
  return `\`${identifier}\``;
}

export async function search(moduleCode, { keyword, page = 1, pageSize = 20, sortField, sortDir } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(200, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safeSize;

  let where = "WHERE module_code = ?";
  const params = [moduleCode];

  if (keyword) {
    where += " AND search_text LIKE ?";
    params.push(`%${keyword}%`);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM business_record ${where}`,
    params,
  );

  let orderClause = "ORDER BY updated_at DESC";
  if (sortField && sortDir) {
    const dir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
    orderClause = `ORDER BY JSON_UNQUOTE(JSON_EXTRACT(record_data, '$.${sortField}')) ${dir}`;
  }

  const [rows] = await pool.query(
    `SELECT * FROM business_record ${where} ${orderClause} LIMIT ? OFFSET ?`,
    [...params, safeSize, offset],
  );

  return {
    rows: rows.map(toDto),
    total,
    page: safePage,
    pageSize: safeSize,
  };
}

export async function getByCode(moduleCode, recordCode) {
  const [rows] = await pool.query(
    "SELECT * FROM business_record WHERE module_code = ? AND record_code = ? LIMIT 1",
    [moduleCode, recordCode],
  );
  return rows[0] ? toDto(rows[0]) : null;
}

export async function create({ moduleCode, recordCode, recordData, searchText }) {
  await pool.query(
    `INSERT INTO business_record (module_code, record_code, record_data, search_text)
     VALUES (?, ?, ?, ?)`,
    [moduleCode, recordCode, JSON.stringify(recordData), searchText],
  );
  return getByCode(moduleCode, recordCode);
}

export async function update(moduleCode, recordCode, { recordData, searchText }) {
  await pool.query(
    `UPDATE business_record
     SET record_data = ?, search_text = ?
     WHERE module_code = ? AND record_code = ?`,
    [JSON.stringify(recordData), searchText, moduleCode, recordCode],
  );
  return getByCode(moduleCode, recordCode);
}

export async function remove(moduleCode, recordCode) {
  const [result] = await pool.query(
    "DELETE FROM business_record WHERE module_code = ? AND record_code = ?",
    [moduleCode, recordCode],
  );
  return result.affectedRows;
}

function toDto(row) {
  return {
    id: `${row.module_code}:${row.record_code}`,
    businessType: row.module_code,
    businessCode: row.record_code,
    fields: typeof row.record_data === "string" ? JSON.parse(row.record_data) : row.record_data,
    updatedAt: row.updated_at || "",
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/repositories/recordRepository.js
git commit -m "feat: add recordRepository — unified business_record CRUD"
```

---

### Task 5: Create recordService.js

**Files:**
- Create: `backend/src/services/recordService.js`

- [ ] **Step 1: Write recordService.js**

```js
import * as recordRepository from "../repositories/recordRepository.js";
import { compileSchema, listModuleSchemas } from "./schemaService.js";
import { appError } from "../utils/response.js";
import XLSX from "xlsx";

export async function listTypes() {
  return listModuleSchemas();
}

export async function searchRecords(query = {}) {
  const moduleCode = String(query.bizType || query.type || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  return recordRepository.search(moduleCode, {
    keyword: String(query.keyword || "").trim(),
    page: query.page,
    pageSize: query.pageSize,
    sortField: query.sortField || schema.recordCodeField.code,
    sortDir: query.sortDir || "ASC",
  });
}

export async function createRecord(payload = {}) {
  const moduleCode = String(payload.bizType || payload.type || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const fields = payload.fields || {};

  const recordCode = String(fields[schema.recordCodeField.code] || "").trim();
  if (!recordCode) throw appError(`${schema.recordCodeField.name}必填`, 40000, 400);

  const recordData = {};
  for (const f of schema.fields) {
    recordData[f.code] = String(fields[f.code] ?? "").trim();
  }

  const searchText = schema.searchableFields
    .map(f => recordData[f.code])
    .filter(Boolean)
    .join(" ");

  try {
    return await recordRepository.create({ moduleCode, recordCode, recordData, searchText });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") throw appError("业务编码已存在", 40001, 409);
    throw error;
  }
}

export async function updateRecord(bizType, bizCode, payload = {}) {
  const moduleCode = String(bizType || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const recordCode = String(bizCode || "").trim();
  if (!recordCode) throw appError("缺少业务编码", 40000, 400);

  const exists = await recordRepository.getByCode(moduleCode, recordCode);
  if (!exists) throw appError("业务数据不存在", 40400, 404);

  const fields = payload.fields || {};
  const recordData = {};
  for (const f of schema.fields) {
    recordData[f.code] = String(fields[f.code] ?? "").trim();
  }

  const searchText = schema.searchableFields
    .map(f => recordData[f.code])
    .filter(Boolean)
    .join(" ");

  return recordRepository.update(moduleCode, recordCode, { recordData, searchText });
}

export async function deleteRecord(bizType, bizCode) {
  const moduleCode = String(bizType || "").toUpperCase();
  const recordCode = String(bizCode || "").trim();
  if (!recordCode) throw appError("缺少业务编码", 40000, 400);
  const affectedRows = await recordRepository.remove(moduleCode, recordCode);
  if (!affectedRows) throw appError("业务数据不存在", 40400, 404);
  return { deleted: true };
}

export async function generateImportTemplate(bizType) {
  const schema = await compileSchema(bizType);
  const headers = schema.fields.map(f => f.name);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, schema.module.label);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function importRecords(bizType, fileBuffer) {
  const schema = await compileSchema(bizType);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw appError("Excel 文件中没有工作表", 40000, 400);

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  if (rows.length < 2) throw appError("Excel 文件中没有数据行", 40000, 400);

  const headerRow = rows[0].map(h => String(h || "").trim());
  const colFieldMap = headerRow.map(h => schema.fields.find(f => f.name === h) || null);

  const codeColIdx = colFieldMap.findIndex(f => f && f.code === schema.recordCodeField.code);
  if (codeColIdx < 0) throw appError(`Excel 表头中未找到"${schema.recordCodeField.name}"列`, 40000, 400);

  const results = { total: 0, success: 0, errors: [] };

  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    results.total++;

    const fields = {};
    let hasValue = false;
    for (let ci = 0; ci < colFieldMap.length; ci++) {
      const f = colFieldMap[ci];
      if (!f) continue;
      const value = String(row[ci] ?? "").trim();
      fields[f.code] = value;
      if (value) hasValue = true;
    }
    if (!hasValue) continue;

    const excelRow = rowIdx + 1;
    try {
      await createRecord({ bizType, fields });
      results.success++;
    } catch (err) {
      results.errors.push({ row: excelRow, message: err.message || "未知错误" });
    }
  }

  return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/recordService.js
git commit -m "feat: add recordService — unified business logic + import/export"
```

---

### Task 6: Update controller and routes

**Files:**
- Modify: `backend/src/controllers/businessDataController.js`

- [ ] **Step 1: Rewrite controller**

```js
import * as recordService from "../services/recordService.js";
import { appError, sendSuccess } from "../utils/response.js";

export async function types(req, res) {
  sendSuccess(res, await recordService.listTypes());
}

export async function search(req, res) {
  sendSuccess(res, await recordService.searchRecords(req.query));
}

export async function create(req, res) {
  sendSuccess(res, await recordService.createRecord(req.body));
}

export async function update(req, res) {
  sendSuccess(res, await recordService.updateRecord(req.params.bizType, req.params.bizCode, req.body));
}

export async function remove(req, res) {
  sendSuccess(res, await recordService.deleteRecord(req.params.bizType, req.params.bizCode));
}

export async function downloadTemplate(req, res) {
  const buffer = await recordService.generateImportTemplate(req.params.bizType);
  const filename = encodeURIComponent(`${req.params.bizType}_导入模板.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function importData(req, res) {
  if (!req.file) throw appError("请上传 Excel 文件", 40000, 400);
  sendSuccess(res, await recordService.importRecords(req.params.bizType, req.file.buffer));
}
```

- [ ] **Step 2: Verify routes unchanged**

```bash
# Routes file should already point to these controller methods — no change needed
grep -n "ctrl\." backend/src/routes/businessData.routes.js
```

Expected: `ctrl.types`, `ctrl.search`, `ctrl.create`, `ctrl.update`, `ctrl.remove`, `ctrl.downloadTemplate`, `ctrl.importData`

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/businessDataController.js
git commit -m "feat: switch businessDataController to recordService"
```

---

### Task 7: Rename columns in dependent code

**Files:**
- Modify: `backend/src/repositories/fieldRepository.js` — `template_type` → `module_code`
- Modify: `backend/src/repositories/businessModuleRepository.js` — `code_field` → `record_code_field`
- Modify: `backend/src/services/businessModuleService.js` — `codeField` → `recordCodeField`
- Modify: `backend/src/controllers/businessModuleController.js` — align field names

- [ ] **Step 1: Update fieldRepository.js**

Every occurrence of `template_type` → `module_code`. Example:

```js
// Before
`SELECT template_type, field_code, ...
 WHERE template_type = ? ...`
// After
`SELECT module_code, field_code, ...
 WHERE module_code = ? ...`
```

Do find-replace on the file: `template_type` → `module_code` (4 SQL columns + 1 comment).

- [ ] **Step 2: Update businessModuleRepository.js**

```bash
sed -i '' 's/code_field/record_code_field/g' backend/src/repositories/businessModuleRepository.js
```

- [ ] **Step 3: Update businessModuleService.js**

```bash
sed -i '' 's/codeField/recordCodeField/g' backend/src/services/businessModuleService.js
sed -i '' 's/code_field/record_code_field/g' backend/src/services/businessModuleService.js
```

- [ ] **Step 4: Update businessModuleController.js**

```bash
sed -i '' 's/codeField/recordCodeField/g' backend/src/controllers/businessModuleController.js
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/repositories/fieldRepository.js backend/src/repositories/businessModuleRepository.js backend/src/services/businessModuleService.js backend/src/controllers/businessModuleController.js
git commit -m "feat: rename template_type→module_code, code_field→record_code_field"
```

---

### Task 8: Verify and restart

**Files:**
- Check: `frontend/src/api/businessDataApi.js` — URL paths

- [ ] **Step 1: Verify frontend API paths unchanged**

```bash
grep "business-data" frontend/src/api/businessDataApi.js
```

Expected: same paths (`/business-data/search`, `/business-data`, `/business-data/:bizType/:bizCode`, `/business-data/template/:bizType`, `/business-data/import/:bizType`)

- [ ] **Step 2: Restart backend and verify**

```bash
# Kill existing, restart
pkill -f "node --watch src/server.js"
cd backend && nohup env ENV_FILE=../.env npm run dev > /tmp/wms-backend.log 2>&1 < /dev/null &
disown
sleep 4

# Health check
curl -s http://127.0.0.1:3001/api/v1/health
# Expected: {"code":0,"message":"success","data":{"service":"ok","database":"ok"}}

# Module list
curl -s http://127.0.0.1:3001/api/v1/business-modules | python3 -m json.tool

# Field list
curl -s http://127.0.0.1:3001/api/v1/template/fields/LOCATION | python3 -c "import sys,json; [print(f['code'],f['name']) for f in json.load(sys.stdin)['data']]"

# CRUD test
curl -s -X POST http://127.0.0.1:3001/api/v1/business-data \
  -H "Content-Type: application/json" \
  -d '{"bizType":"LOCATION","fields":{"locationCode":"TEST-001","warehouseCode":"JP01"}}' | python3 -m json.tool

curl -s "http://127.0.0.1:3001/api/v1/business-data/search?bizType=LOCATION" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'rows: {len(d[\"data\"][\"rows\"])}')"

curl -s -X DELETE "http://127.0.0.1:3001/api/v1/business-data/LOCATION/TEST-001" | python3 -c "import sys,json; print(json.load(sys.stdin)['message'])"
```

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A
git status
git commit -m "chore: final verification — unified backend refactor complete"
```
