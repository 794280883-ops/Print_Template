import assert from "node:assert/strict";
import { after } from "node:test";
import test from "node:test";
import bcrypt from "bcryptjs";
import XLSX from "xlsx";
import { createApp } from "../src/app.js";
import { pool } from "../src/config/db.js";
import { testDbPool } from "../src/config/testDb.js";

const rawFetch = globalThis.fetch.bind(globalThis);
const adminTokensByOrigin = new Map();

after(async () => {
  await pool.end();
  await testDbPool.end();
});

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function login(port, username = "admin", password = "123456") {
  const response = await rawFetch(`http://127.0.0.1:${port}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  return body.data.token;
}

async function createNoRoleUser(username, password = "123456") {
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO sys_user (username, password, nickname, status) VALUES (?, ?, ?, 1)",
    [username, passwordHash, "无权限测试用户"],
  );
}

async function getAdminToken(origin) {
  if (!adminTokensByOrigin.has(origin)) {
    const url = new URL(origin);
    adminTokensByOrigin.set(origin, await login(url.port));
  }
  return adminTokensByOrigin.get(origin);
}

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  const isApi = url.pathname.startsWith("/api/v1/");
  const isPublic = url.pathname === "/api/v1/auth/login" || url.pathname.startsWith("/api/v1/health");
  const headers = new Headers(options.headers || {});

  if (isApi && !isPublic && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${await getAdminToken(url.origin)}`);
  }

  return rawFetch(input, { ...options, headers });
};

test("GET /api/v1/health returns standard response", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.service, "ok");
  } finally {
    server.close();
  }
});

test("protected template APIs require login and permission", async () => {
  const server = await listen(createApp());
  const username = `norole_${Date.now().toString(36)}`;
  try {
    const port = server.address().port;

    let response = await rawFetch(`http://127.0.0.1:${port}/api/v1/templates`);
    let body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.code, 40100);

    const adminToken = await login(port);
    response = await rawFetch(`http://127.0.0.1:${port}/api/v1/templates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);

    await createNoRoleUser(username);
    const noRoleToken = await login(port, username);
    response = await rawFetch(`http://127.0.0.1:${port}/api/v1/templates`, {
      headers: { Authorization: `Bearer ${noRoleToken}` },
    });
    body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.code, 40300);
  } finally {
    await pool.query("DELETE FROM sys_user WHERE username = ?", [username]);
    server.close();
  }
});

test("GET /api/v1/template/fields/location returns field dictionary", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/template/fields/location`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.ok(Array.isArray(body.data));
  } finally {
    server.close();
  }
});

test("GET /api/v1/health/db returns test database health response", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/health/db`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.database, "ok");
  } finally {
    server.close();
  }
});

test("GET /api/v1/business-data/types returns configured business types", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/types`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    for (const code of ["LOCATION", "CONTAINER", "PRODUCT"]) {
      assert.ok(body.data.some((item) => item.code === code));
    }
  } finally {
    server.close();
  }
});

test("GET /api/v1/business-modules returns enabled module configurations", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    for (const expected of [
      { code: "LOCATION", templateLabel: "库位模板", dataLabel: "库位数据" },
      { code: "CONTAINER", templateLabel: "容器模板", dataLabel: "容器数据" },
      { code: "PRODUCT", templateLabel: "商品模板", dataLabel: "商品数据" },
    ]) {
      const item = body.data.find((row) => row.code === expected.code);
      assert.ok(item);
      assert.equal(item.templateLabel, expected.templateLabel);
      assert.equal(item.dataLabel, expected.dataLabel);
    }
  } finally {
    server.close();
  }
});

test("POST /api/v1/business-modules creates custom module with fields", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const moduleCode = `TST_${suffix}`;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: moduleCode,
        name: "测试模块",
        templateLabel: "测试模板",
        dataLabel: "测试数据",
        codeField: "testCode",
        fields: [
          { code: "testCode", name: "测试编码", type: "string", required: true, example: "T001", desc: "唯一编码", sortNo: 10 },
          { code: "testName", name: "测试名称", type: "string", required: false, example: "名称", desc: "名称", sortNo: 20 },
        ],
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.code, moduleCode);
    assert.equal(body.data.storageMode, "json_table");

    const fieldsResponse = await fetch(`http://127.0.0.1:${port}/api/v1/template/fields/${moduleCode}`);
    const fieldsBody = await fieldsResponse.json();
    assert.equal(fieldsResponse.status, 200);
    assert.deepEqual(fieldsBody.data.map((item) => item.code), ["testCode", "testName"]);
  } finally {
    server.close();
  }
});

test("DELETE /api/v1/business-modules/:code disables custom module from module and business data lists", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const moduleCode = `DEL_${suffix}`;
    await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: moduleCode,
        name: "删除验证模块",
        templateLabel: "删除验证模板",
        dataLabel: "删除验证数据",
        codeField: "deleteCode",
        fields: [{ code: "deleteCode", name: "删除编码", type: "string", required: true, sortNo: 10 }],
      }),
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules/${moduleCode}`, { method: "DELETE" });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.code, moduleCode);
    assert.equal(body.data.deleted, true);

    const modulesResponse = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`);
    const modulesBody = await modulesResponse.json();
    assert.equal(modulesResponse.status, 200);
    assert.equal(modulesBody.data.some((item) => item.code === moduleCode), false);

    const typesResponse = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/types`);
    const typesBody = await typesResponse.json();
    assert.equal(typesResponse.status, 200);
    assert.equal(typesBody.data.some((item) => item.code === moduleCode), false);
  } finally {
    server.close();
  }
});

test("POST /api/v1/business-modules restores a disabled module and its primary field", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const moduleCode = `RST_${suffix}`;
    const requestBody = {
      code: moduleCode,
      name: "恢复前模块",
      templateLabel: "恢复前模板",
      dataLabel: "恢复前数据",
      recordCodeField: "restoreCode",
      fields: [{ code: "restoreCode", name: "恢复前编码", type: "string", required: true, sortNo: 10 }],
    };

    let response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    assert.equal(response.status, 200);

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules/${moduleCode}`, { method: "DELETE" });
    assert.equal(response.status, 200);

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...requestBody,
        name: "恢复后模块",
        templateLabel: "恢复后模板",
        dataLabel: "恢复后数据",
        fields: [{ ...requestBody.fields[0], name: "恢复后编码" }],
      }),
    });
    const restoredBody = await response.json();
    assert.equal(response.status, 200);
    assert.equal(restoredBody.data.name, "恢复后模块");
    assert.equal(restoredBody.data.enabled, true);

    const fieldsResponse = await fetch(`http://127.0.0.1:${port}/api/v1/template/fields/${moduleCode}`);
    const fieldsBody = await fieldsResponse.json();
    assert.deepEqual(fieldsBody.data.map((item) => ({ code: item.code, name: item.name, enabled: item.enabled })), [
      { code: "restoreCode", name: "恢复后编码", enabled: true },
    ]);

    const modulesBody = await (await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`)).json();
    assert.equal(modulesBody.data.some((item) => item.code === moduleCode && item.templateLabel === "恢复后模板"), true);

    const typesBody = await (await fetch(`http://127.0.0.1:${port}/api/v1/business-data/types`)).json();
    assert.equal(typesBody.data.some((item) => item.code === moduleCode && item.label === "恢复后数据"), true);
  } finally {
    server.close();
  }
});

test("DELETE /api/v1/business-modules/:code rejects built-in module", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules/LOCATION`, { method: "DELETE" });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 40000);
    assert.match(body.message, /系统内置模块/);
  } finally {
    server.close();
  }
});

test("PUT /api/v1/business-modules/:code updates module display names", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const moduleCode = `REN_${suffix}`;
    await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: moduleCode,
        name: "原模块",
        templateLabel: "原模板类型",
        dataLabel: "原业务数据",
        codeField: "renameCode",
        fields: [{ code: "renameCode", name: "重命名编码", type: "string", required: true, sortNo: 10 }],
      }),
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules/${moduleCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "新模块",
        templateLabel: "新模板类型",
        dataLabel: "新业务数据",
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.name, "新模块");
    assert.equal(body.data.templateLabel, "新模板类型");
    assert.equal(body.data.dataLabel, "新业务数据");

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`);
    const listBody = await listResponse.json();
    const item = listBody.data.find((row) => row.code === moduleCode);
    assert.equal(item.name, "新模块");
    assert.equal(item.templateLabel, "新模板类型");
    assert.equal(item.dataLabel, "新业务数据");
  } finally {
    server.close();
  }
});

test("PUT /api/v1/business-modules/:code/fields/:fieldCode updates field metadata", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const moduleCode = `TUF_${suffix}`;
    await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: moduleCode,
        name: "字段更新模块",
        templateLabel: "字段更新模板",
        dataLabel: "字段更新数据",
        codeField: "itemCode",
        fields: [{ code: "itemCode", name: "原名称", type: "string", required: true, sortNo: 10 }],
      }),
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules/${moduleCode}/fields/itemCode`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新名称", type: "string", required: true, example: "I001", desc: "更新说明", sortNo: 5 }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.name, "新名称");
    assert.equal(body.data.sortNo, 5);
  } finally {
    server.close();
  }
});

test("POST /api/v1/business-modules/:code/fields/:fieldCode/disable rejects referenced field", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-modules/LOCATION/fields/locationCode/disable`, { method: "POST" });
    const body = await response.json();
    assert.equal(response.status, 409);
    assert.equal(body.code, 40002);
    assert.match(body.message, /已被模板引用/);
  } finally {
    server.close();
  }
});

test("custom module business data uses business_data JSON storage", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const moduleCode = `BD_${suffix}`;
    await fetch(`http://127.0.0.1:${port}/api/v1/business-modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: moduleCode,
        name: "业务数据模块",
        templateLabel: "业务数据模板",
        dataLabel: "业务数据",
        codeField: "bizCode",
        fields: [
          { code: "bizCode", name: "业务编码", type: "string", required: true, sortNo: 10 },
          { code: "bizName", name: "业务名称", type: "string", required: false, sortNo: 20 },
        ],
      }),
    });

    let response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bizType: moduleCode, fields: { bizCode: "B001", bizName: "第一条" } }),
    });
    let body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.businessCode, "B001");
    assert.equal(body.data.fields.bizName, "第一条");

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/search?bizType=${moduleCode}&keyword=第一`);
    body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.total, 1);
    assert.equal(body.data.rows[0].fields.bizCode, "B001");

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/${moduleCode}/B001`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { bizCode: "B001", bizName: "已更新" } }),
    });
    body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.fields.bizName, "已更新");

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/${moduleCode}/B001`, { method: "DELETE" });
    body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.deleted, true);
  } finally {
    server.close();
  }
});

test("business data import template returns headers without comment", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/template/LOCATION`);
    const workbook = XLSX.read(Buffer.from(await response.arrayBuffer()), { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    assert.equal(response.status, 200);
    assert.equal(worksheet.A1.v, "库位编码");
    assert.equal(worksheet.A1.c, undefined);
  } finally {
    server.close();
  }
});

test("business data primary field is unique and cannot be changed", async () => {
  const server = await listen(createApp());
  const recordCode = `UNIQUE_${Date.now().toString(36).toUpperCase()}`;
  try {
    const port = server.address().port;
    let response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bizType: "LOCATION", fields: { locationCode: recordCode } }),
    });
    assert.equal(response.status, 200);

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bizType: "LOCATION", fields: { locationCode: recordCode } }),
    });
    const duplicateBody = await response.json();
    assert.equal(response.status, 409);
    assert.match(duplicateBody.message, /已存在/);

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/LOCATION/${recordCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { locationCode: `${recordCode}_CHANGED` } }),
    });
    const updateBody = await response.json();
    assert.equal(response.status, 400);
    assert.match(updateBody.message, /不允许修改/);
  } finally {
    await pool.query("DELETE FROM business_record WHERE module_code = ? AND record_code IN (?, ?)", [
      "LOCATION",
      recordCode,
      `${recordCode}_CHANGED`,
    ]);
    server.close();
  }
});

test("business data import allows duplicate and existing primary values", async () => {
  const server = await listen(createApp());
  const suffix = Date.now().toString(36).toUpperCase();
  const existingCode = `IMP_EXIST_${suffix}`;
  const duplicateCode = `IMP_DUP_${suffix}`;
  const validCode = `IMP_OK_${suffix}`;
  try {
    const port = server.address().port;
    let response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bizType: "LOCATION", fields: { locationCode: existingCode } }),
    });
    assert.equal(response.status, 200);

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["库位编码"],
      [existingCode],
      [duplicateCode],
      [duplicateCode],
      [validCode],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "库位数据");
    const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const form = new FormData();
    form.append("file", new Blob([fileBuffer]), "location-import.xlsx");

    response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/import/LOCATION`, {
      method: "POST",
      body: form,
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.total, 4);
    assert.equal(body.data.success, 4);
    assert.equal(body.data.errors.length, 0);

    const [rows] = await pool.query(
      "SELECT record_code FROM business_record WHERE module_code = ? AND record_code IN (?, ?, ?)",
      ["LOCATION", existingCode, duplicateCode, validCode],
    );
    assert.equal(rows.length, 4);
  } finally {
    await pool.query("DELETE FROM business_record WHERE module_code = ? AND record_code IN (?, ?, ?)", [
      "LOCATION",
      existingCode,
      duplicateCode,
      validCode,
    ]);
    server.close();
  }
});

test("POST /api/v1/print/pdf rejects mismatched business type", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const suffix = Date.now().toString(36).toUpperCase();
    const templateResponse = await fetch(`http://127.0.0.1:${port}/api/v1/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateCode: `TPL_PRINT_${suffix}`,
        templateName: `打印校验-${suffix}`,
        templateType: "LOCATION",
        status: "enabled",
        size: { width: 80, height: 40, unit: "mm", dpi: 203 },
        elements: [
          { id: "txt_location", type: "text", textKind: "field", x: 4, y: 4, width: 40, height: 8, bindField: "locationCode" },
        ],
      }),
    });
    const templateBody = await templateResponse.json();
    assert.equal(templateResponse.status, 200);

    const response = await fetch(`http://127.0.0.1:${port}/api/v1/print/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: templateBody.data.id,
        businessType: "CONTAINER",
        rows: [{ locationCode: "L001" }],
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 40005);
    assert.match(body.message, /业务类型与模板类型不一致/);
  } finally {
    server.close();
  }
});

test("GET /api/v1/business-data/search rejects invalid business type", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/business-data/search?bizType=UNKNOWN`);
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 40000);
  } finally {
    server.close();
  }
});

test("POST /api/v1/templates/1/enable enables seeded template when DB tests are enabled", async (t) => {
  if (process.env.RUN_DB_TESTS !== "1") {
    t.skip("Set RUN_DB_TESTS=1 after MySQL migration to run template enable API integration test.");
    return;
  }

  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/templates/1/enable`, { method: "POST" });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.status, "enabled");
  } finally {
    server.close();
  }
});
