import assert from "node:assert/strict";
import { after } from "node:test";
import test from "node:test";
import { createApp } from "../src/app.js";
import { pool } from "../src/config/db.js";
import { testDbPool } from "../src/config/testDb.js";

after(async () => {
  await pool.end();
  await testDbPool.end();
});

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

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
    assert.deepEqual(body.data.map((item) => item.code), ["LOCATION", "CONTAINER", "PRODUCT"]);
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
