import assert from "node:assert/strict";
import test from "node:test";
import { validateTemplateDsl } from "../src/utils/dsl.js";

const locationFields = [
  { field_code: "locationCode" },
  { field_code: "locationPrefix" },
  { field_code: "directionMark" },
];

test("validateTemplateDsl accepts a valid location label", () => {
  const result = validateTemplateDsl({
    templateName: "库位标签-100x50",
    templateType: "LOCATION",
    size: { width: 100, height: 50 },
    elements: [
      { id: "text_location_code", type: "text", textKind: "field", x: 14, y: 5, width: 72, height: 11, bindField: "locationCode" },
      { id: "qr_location_code", type: "qrcode", x: 8, y: 23, width: 20, height: 20, bindField: "locationCode" },
    ],
  }, locationFields);

  assert.equal(result.canPublish, true);
  assert.deepEqual(result.errors, []);
});

test("validateTemplateDsl rejects missing barcode field binding", () => {
  const result = validateTemplateDsl({
    templateName: "错误模板",
    templateType: "LOCATION",
    size: { width: 100, height: 50 },
    elements: [
      { id: "bad_barcode", type: "barcode", x: 8, y: 23, width: 20, height: 20 },
    ],
  }, locationFields);

  assert.equal(result.canPublish, false);
  assert.match(result.errors[0].message, /没有绑定字段/);
});

test("validateTemplateDsl accepts supported barcode formats and default legacy barcode format", () => {
  const formats = [undefined, "code128", "upca"];

  for (const barcodeFormat of formats) {
    const result = validateTemplateDsl({
      templateName: "条码模板",
      templateType: "LOCATION",
      size: { width: 100, height: 50 },
      elements: [
        { id: `barcode_${barcodeFormat || "default"}`, type: "barcode", x: 8, y: 23, width: 52, height: 16, bindField: "locationCode", barcodeFormat },
      ],
    }, locationFields);

    assert.equal(result.canPublish, true);
    assert.deepEqual(result.errors, []);
  }
});

test("validateTemplateDsl rejects unsupported barcode format", () => {
  for (const barcodeFormat of ["pdf417", "ean13", "itf14", "gs1-128"]) {
    const result = validateTemplateDsl({
      templateName: "错误模板",
      templateType: "LOCATION",
      size: { width: 100, height: 50 },
      elements: [
        { id: `bad_format_${barcodeFormat}`, type: "barcode", x: 8, y: 23, width: 52, height: 16, bindField: "locationCode", barcodeFormat },
      ],
    }, locationFields);

    assert.equal(result.canPublish, false);
    assert.match(result.errors[0].message, /条码码制不支持/);
  }
});

test("validateTemplateDsl rejects fields outside dictionary", () => {
  const result = validateTemplateDsl({
    templateName: "错误模板",
    templateType: "LOCATION",
    size: { width: 100, height: 50 },
    elements: [
      { id: "unknown_field", type: "text", textKind: "field", x: 1, y: 1, width: 20, height: 8, bindField: "unknownCode" },
    ],
  }, locationFields);

  assert.equal(result.canPublish, false);
  assert.match(result.errors[0].message, /不存在于当前模板类型模版字段/);
});

test("validateTemplateDsl accepts custom template type when field dictionary matches", () => {
  const result = validateTemplateDsl({
    templateName: "自定义标签",
    templateType: "PALLET",
    size: { width: 80, height: 40 },
    elements: [
      { id: "text_pallet_code", type: "text", textKind: "field", x: 4, y: 4, width: 40, height: 8, bindField: "palletCode" },
    ],
  }, [{ field_code: "palletCode" }]);

  assert.equal(result.canPublish, true);
  assert.deepEqual(result.errors, []);
});

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
  }, [{ field_code: "skuCode" }]);

  assert.equal(result.canPublish, true);
  assert.deepEqual(result.errors, []);
});
