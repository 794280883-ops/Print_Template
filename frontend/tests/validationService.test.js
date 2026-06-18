import assert from "node:assert/strict";
import test from "node:test";
import { validateTemplateDsl } from "../src/services/validationService.js";

const productFields = [
  { code: "skuCode", name: "商品编码" },
];

test("validateTemplateDsl allows a 270 degree rotated element when its rendered box stays inside the canvas", () => {
  const result = validateTemplateDsl({
    templateName: "商品标签",
    templateType: "PRODUCT",
    size: { width: 30, height: 70 },
    elements: [
      {
        id: "barcode_rotated",
        type: "barcode",
        x: -1.7,
        y: 24.1,
        width: 42,
        height: 13,
        rotate: 270,
        bindField: "skuCode",
      },
    ],
  }, productFields);

  assert.equal(result.canPublish, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});
