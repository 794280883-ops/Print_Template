import assert from "node:assert/strict";
import test from "node:test";
import { validateTemplateDsl as validateBackendTemplateDsl } from "../src/utils/dsl.js";
import { validateTemplateDsl as validateFrontendTemplateDsl } from "../../frontend/src/services/validationService.js";

const fields = [
  { code: "locationCode", field_code: "locationCode", name: "库位编码" },
  { code: "warehouseCode", field_code: "warehouseCode", name: "区域仓编码" },
];

const cases = [
  {
    name: "valid template",
    template: {
      templateName: "库位标签",
      templateType: "LOCATION",
      size: { width: 100, height: 50 },
      elements: [
        { id: "text_location", type: "text", textKind: "field", x: 4, y: 4, width: 40, height: 8, bindField: "locationCode" },
        { id: "qr_location", type: "qrcode", x: 70, y: 10, width: 18, height: 18, bindField: "locationCode" },
      ],
    },
  },
  {
    name: "partially out of canvas element",
    template: {
      templateName: "库位标签",
      templateType: "LOCATION",
      size: { width: 100, height: 50 },
      elements: [
        { id: "text_location", type: "text", textKind: "field", x: -2, y: 4, width: 40, height: 8, bindField: "locationCode" },
        { id: "qr_location", type: "qrcode", x: 70, y: 10, width: 18, height: 18, bindField: "locationCode" },
      ],
    },
  },
  {
    name: "small code element",
    template: {
      templateName: "库位标签",
      templateType: "LOCATION",
      size: { width: 100, height: 50 },
      elements: [
        { id: "barcode_location", type: "barcode", x: 4, y: 4, width: 10, height: 10, bindField: "locationCode" },
      ],
    },
  },
  {
    name: "template without code element",
    template: {
      templateName: "库位标签",
      templateType: "LOCATION",
      size: { width: 100, height: 50 },
      elements: [
        { id: "text_location", type: "text", textKind: "field", x: 4, y: 4, width: 40, height: 8, bindField: "locationCode" },
      ],
    },
  },
];

for (const item of cases) {
  test(`backend and frontend DSL validation stay aligned: ${item.name}`, () => {
    const backend = normalizeResult(validateBackendTemplateDsl(item.template, fields));
    const frontend = normalizeResult(validateFrontendTemplateDsl(item.template, fields));
    assert.deepEqual(backend, frontend);
  });
}

function normalizeResult(result) {
  return {
    canPublish: result.canPublish,
    errors: normalizeItems(result.errors),
    warnings: normalizeItems(result.warnings),
    tips: normalizeItems(result.tips),
  };
}

function normalizeItems(items = []) {
  return items.map((item) => ({
    message: item.message,
    elementId: item.elementId,
  }));
}
