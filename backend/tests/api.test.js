import assert from "node:assert/strict";
import { after } from "node:test";
import test from "node:test";
import { createApp } from "../src/app.js";
import { pool } from "../src/config/db.js";

after(async () => {
  await pool.end();
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

test("POST /api/v1/ai/templates/generate returns DSL draft", async () => {
  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/ai/templates/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateType: "CONTAINER", prompt: "容器标签 二维码" }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.templateType, "CONTAINER");
    assert.ok(Array.isArray(body.data.elements));
  } finally {
    server.close();
  }
});

test("POST /api/v1/templates/1/publish publishes seeded template when DB tests are enabled", async (t) => {
  if (process.env.RUN_DB_TESTS !== "1") {
    t.skip("Set RUN_DB_TESTS=1 after MySQL migration to run publish API integration test.");
    return;
  }

  const server = await listen(createApp());
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/templates/1/publish`, { method: "POST" });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.code, 0);
    assert.equal(body.data.status, "published");
  } finally {
    server.close();
  }
});
