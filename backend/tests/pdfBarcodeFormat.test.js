import assert from "node:assert/strict";
import test from "node:test";
import { resolveBarcodeBcid, validateTemplateBarcodeValues } from "../src/services/pdfGenerator.js";

test("resolveBarcodeBcid maps supported template barcode formats to bwip-js bcid", () => {
  assert.equal(resolveBarcodeBcid(undefined), "code128");
  assert.equal(resolveBarcodeBcid("code128"), "code128");
  assert.equal(resolveBarcodeBcid("upca"), "upca");
});

test("resolveBarcodeBcid falls back to code128 for unknown formats", () => {
  assert.equal(resolveBarcodeBcid("pdf417"), "code128");
});

test("validateTemplateBarcodeValues rejects location codes for UPC-A", async () => {
  const template = {
    elements: [
      { id: "upca_location", type: "barcode", bindField: "locationCode", barcodeFormat: "upca" },
    ],
  };

  const issues = await validateTemplateBarcodeValues(template, [{ locationCode: "KW-001" }]);

  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /UPC-A/);
});

test("validateTemplateBarcodeValues accepts valid values for configured formats", async () => {
  const template = {
    elements: [
      { id: "code128_location", type: "barcode", bindField: "code128Value", barcodeFormat: "code128" },
      { id: "upca_location", type: "barcode", bindField: "upcaValue", barcodeFormat: "upca" },
    ],
  };

  const issues = await validateTemplateBarcodeValues(template, [{
    code128Value: "KW-001",
    upcaValue: "012345678905",
  }]);

  assert.deepEqual(issues, []);
});

test("validateTemplateBarcodeValues rejects removed barcode formats", async () => {
  const template = {
    elements: [
      { id: "ean13_removed", type: "barcode", bindField: "barcodeValue", barcodeFormat: "ean13" },
      { id: "itf14_removed", type: "barcode", bindField: "barcodeValue", barcodeFormat: "itf14" },
      { id: "gs1_removed", type: "barcode", bindField: "barcodeValue", barcodeFormat: "gs1-128" },
    ],
  };

  const issues = await validateTemplateBarcodeValues(template, [{ barcodeValue: "123456789012" }]);

  assert.equal(issues.length, 3);
  assert.match(issues[0].message, /条码码制不支持/);
  assert.match(issues[1].message, /条码码制不支持/);
  assert.match(issues[2].message, /条码码制不支持/);
});
