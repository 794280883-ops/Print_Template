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

test("validateTemplateDsl accepts supported barcode formats and default legacy barcode format", () => {
  const formats = [undefined, "code128", "upca"];

  for (const barcodeFormat of formats) {
    const result = validateTemplateDsl({
      templateName: "商品条码",
      templateType: "PRODUCT",
      size: { width: 80, height: 40 },
      elements: [
        { id: `barcode_${barcodeFormat || "default"}`, type: "barcode", x: 4, y: 4, width: 52, height: 16, bindField: "skuCode", barcodeFormat },
      ],
    }, productFields);

    assert.equal(result.canPublish, true);
    assert.deepEqual(result.errors, []);
  }
});

test("validateTemplateDsl rejects unsupported barcode format", () => {
  for (const barcodeFormat of ["pdf417", "ean13", "itf14", "gs1-128"]) {
    const result = validateTemplateDsl({
      templateName: "商品条码",
      templateType: "PRODUCT",
      size: { width: 80, height: 40 },
      elements: [
        { id: `bad_format_${barcodeFormat}`, type: "barcode", x: 4, y: 4, width: 52, height: 16, bindField: "skuCode", barcodeFormat },
      ],
    }, productFields);

    assert.equal(result.canPublish, false);
    assert.match(result.errors[0].message, /条码码制不支持/);
  }
});
