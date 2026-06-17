import assert from "node:assert/strict";
import test from "node:test";
import { loadTemplateForDesigner, normalizeTemplateType, resolveTemplateFields } from "../src/views/templates/templateDesignerLoader.js";

test("normalizes template type before loading designer fields", async () => {
  const calls = [];
  const template = await loadTemplateForDesigner("12", {
    getTemplate: async (id) => ({
      id,
      templateCode: "TPL_CONTAINER_001",
      templateName: "容器模板",
      templateType: " container ",
      size: { width: 100, height: 50 },
      elements: [],
    }),
    fetchFields: async (templateType) => {
      calls.push(templateType);
    },
  });

  assert.equal(template.templateType, "CONTAINER");
  assert.deepEqual(calls, ["CONTAINER"]);
});

test("resolves fields by normalized template type", () => {
  assert.equal(normalizeTemplateType(" product "), "PRODUCT");
  assert.deepEqual(
    resolveTemplateFields(" product ", { PRODUCT: [{ code: "productCode" }] }, {}),
    [{ code: "productCode" }],
  );
});
