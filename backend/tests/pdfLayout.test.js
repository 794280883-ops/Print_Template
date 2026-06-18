import assert from "node:assert/strict";
import test from "node:test";
import {
  CSS_PX_TO_PT,
  MM_TO_PT,
  cssPxToPdfPt,
  elementBoxToPdfPoints,
  getBarcodeLayout,
  getTextLayout,
} from "../src/services/pdfLayout.js";

test("converts designer CSS pixel font size to PDF points", () => {
  assert.equal(CSS_PX_TO_PT, 0.75);
  assert.equal(cssPxToPdfPt(16), 12);
  assert.equal(cssPxToPdfPt(undefined), 9);
});

test("keeps element geometry in millimeters when converting to PDF points", () => {
  assert.deepEqual(elementBoxToPdfPoints({ x: 10, y: 5, width: 30, height: 8 }), {
    x: 10 * MM_TO_PT,
    y: 5 * MM_TO_PT,
    w: 30 * MM_TO_PT,
    h: 8 * MM_TO_PT,
  });
});

test("text layout matches preview single-line clipped element semantics", () => {
  const box = elementBoxToPdfPoints({ x: 0, y: 0, width: 20, height: 8 });
  const layout = getTextLayout({
    fontSize: 16,
    align: "center",
  }, box);

  assert.equal(layout.fontSize, 12);
  assert.equal(layout.options.width, box.w);
  assert.equal(layout.options.height, box.h);
  assert.equal(layout.options.align, "center");
  assert.equal(layout.options.lineBreak, false);
  assert.equal(layout.options.ellipsis, true);
});

test("barcode layout reserves bottom space for visible human readable text by default", () => {
  const box = elementBoxToPdfPoints({ x: 0, y: 0, width: 42, height: 13 });
  const layout = getBarcodeLayout({ type: "barcode", bindField: "skuCode" }, box);

  assert.equal(layout.showHumanText, true);
  assert.equal(layout.humanTextFontSize, 6);
  assert.equal(layout.barcodeBox.x, box.x);
  assert.equal(layout.barcodeBox.y, box.y);
  assert.equal(layout.barcodeBox.w, box.w);
  assert.ok(layout.barcodeBox.h < box.h);
  assert.equal(layout.textBox.y, layout.barcodeBox.y + layout.barcodeBox.h + layout.humanTextGap);
  assert.equal(layout.humanTextGap, 1.5);
});

test("barcode layout can hide human readable text", () => {
  const box = elementBoxToPdfPoints({ x: 0, y: 0, width: 42, height: 13 });
  const layout = getBarcodeLayout({ type: "barcode", showHumanText: false }, box);

  assert.equal(layout.showHumanText, false);
  assert.deepEqual(layout.barcodeBox, box);
  assert.equal(layout.textBox, null);
});
