import assert from "node:assert/strict";
import test from "node:test";
import { authorizedFetch, createAuthHeaders } from "../src/services/authFetchService.js";

test("createAuthHeaders adds bearer token without dropping existing headers", () => {
  assert.deepEqual(
    createAuthHeaders("token-123", { "Content-Type": "application/json" }),
    {
      "Content-Type": "application/json",
      Authorization: "Bearer token-123",
    },
  );
});

test("authorizedFetch keeps form-data content type unset and sends authorization", async () => {
  const calls = [];

  await authorizedFetch("/business-data/import/PACK", {
    method: "POST",
    body: { form: true },
  }, {
    apiBaseUrl: "/api/v1",
    token: "token-123",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true };
    },
  });

  assert.deepEqual(calls, [{
    url: "/api/v1/business-data/import/PACK",
    options: {
      method: "POST",
      body: { form: true },
      headers: {
        Authorization: "Bearer token-123",
      },
    },
  }]);
});
