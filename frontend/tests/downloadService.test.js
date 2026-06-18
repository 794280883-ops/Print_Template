import assert from "node:assert/strict";
import test from "node:test";
import { downloadAuthenticatedBlob } from "../src/services/downloadService.js";

test("downloadAuthenticatedBlob fetches file with bearer token and triggers download", async () => {
  const calls = [];
  const clicked = [];
  const appended = [];
  const removed = [];

  const anchor = {
    click: () => clicked.push(true),
  };
  const documentRef = {
    createElement: (tag) => {
      assert.equal(tag, "a");
      return anchor;
    },
    body: {
      appendChild: (node) => appended.push(node),
      removeChild: (node) => removed.push(node),
    },
  };
  const urlApi = {
    createObjectURL: (blob) => {
      calls.push({ createObjectURL: blob });
      return "blob:template";
    },
    revokeObjectURL: (url) => calls.push({ revokeObjectURL: url }),
  };
  const fileBlob = new Blob(["template"]);

  await downloadAuthenticatedBlob("/business-data/template/PACK", "PACK_导入模板.xlsx", {
    apiBaseUrl: "/api/v1",
    token: "token-123",
    documentRef,
    urlApi,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        blob: async () => fileBlob,
      };
    },
  });

  assert.deepEqual(calls[0], {
    url: "/api/v1/business-data/template/PACK",
    options: { headers: { Authorization: "Bearer token-123" } },
  });
  assert.equal(anchor.href, "blob:template");
  assert.equal(anchor.download, "PACK_导入模板.xlsx");
  assert.deepEqual(appended, [anchor]);
  assert.deepEqual(clicked, [true]);
  assert.deepEqual(removed, [anchor]);
  assert.deepEqual(calls[2], { revokeObjectURL: "blob:template" });
});
