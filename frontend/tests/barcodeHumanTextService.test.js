import assert from "node:assert/strict";
import test from "node:test";
import {
  BARCODE_HUMAN_TEXT_GAP,
  getBarcodeBarStyle,
  getBarcodeHumanText,
  getBarcodeHumanTextFontSize,
  isBarcodeHumanTextVisible,
} from "../src/services/barcodeHumanTextService.js";

test("barcode human text is visible by default and uses bound data value", () => {
  const element = { type: "barcode", bindField: "skuCode" };

  assert.equal(isBarcodeHumanTextVisible(element), true);
  assert.equal(getBarcodeHumanText(element, { skuCode: "SKU001" }), "SKU001");
});

test("barcode human text can be hidden", () => {
  const element = { type: "barcode", bindField: "skuCode", showHumanText: false };

  assert.equal(isBarcodeHumanTextVisible(element), false);
  assert.equal(getBarcodeHumanText(element, { skuCode: "SKU001" }), "");
});

test("barcode human text font size defaults to 8px and scales with preview zoom", () => {
  assert.equal(getBarcodeHumanTextFontSize({ type: "barcode" }), 8);
  assert.equal(getBarcodeHumanTextFontSize({ type: "barcode", humanTextFontSize: 10 }, 1.5), 15);
});

test("barcode bar keeps visible height when human text is shown", () => {
  assert.deepEqual(getBarcodeBarStyle({ type: "barcode", humanTextFontSize: 8 }, 1), {
    flex: "0 0 auto",
    height: "calc(100% - 10px)",
  });
});

test("barcode bar fills the element when human text is hidden", () => {
  assert.deepEqual(getBarcodeBarStyle({ type: "barcode", showHumanText: false }, 1), {
    flex: "0 0 auto",
    height: "100%",
  });
});

test("barcode human text gap scales with preview zoom", () => {
  assert.equal(BARCODE_HUMAN_TEXT_GAP, 2);
  assert.deepEqual(getBarcodeBarStyle({ type: "barcode", humanTextFontSize: 8 }, 1.5), {
    flex: "0 0 auto",
    height: "calc(100% - 15px)",
  });
});
