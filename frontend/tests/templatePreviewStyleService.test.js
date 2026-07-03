import assert from "node:assert/strict";
import test from "node:test";
import {
  getTemplatePreviewBarcodeHumanTextStyle,
  getTemplatePreviewCanvasStyle,
  getTemplatePreviewElementStyle,
  getTemplatePreviewText,
} from "../src/services/templatePreviewStyleService.js";

const template = { size: { width: 80, height: 40 } };

test("template preview canvas style scales by available width", () => {
  assert.deepEqual(getTemplatePreviewCanvasStyle(template, { maxScale: 1.3, maxWidth: 300 }), {
    width: "300px",
    height: "150px",
  });
});

test("template preview element style keeps existing visual defaults", () => {
  assert.deepEqual(
    getTemplatePreviewElementStyle(
      { type: "text", x: 1, y: 2, width: 10, height: 5, fontSize: 12, bold: true, rotate: 90 },
      template,
      { maxScale: 1.3, maxWidth: 300 },
    ),
    {
      left: "3.75px",
      top: "7.5px",
      width: "37.5px",
      height: "18.75px",
      zIndex: 1,
      fontSize: "11.25px",
      fontWeight: 700,
      color: "#111827",
      background: "transparent",
      transform: "rotate(90deg)",
    },
  );
});

test("template preview barcode text style uses the same scale", () => {
  assert.deepEqual(
    getTemplatePreviewBarcodeHumanTextStyle({ type: "barcode", humanTextFontSize: 8 }, template, { maxScale: 1.3, maxWidth: 300 }),
    {
      fontSize: "7.5px",
      marginTop: "1.875px",
    },
  );
});

test("template preview text placeholder stays aligned with pages", () => {
  assert.equal(getTemplatePreviewText({ type: "text", textKind: "field", bindField: "locationCode" }), "[locationCode]");
  assert.equal(getTemplatePreviewText({ type: "text", textKind: "field", bindField: "directionMark" }), "↑↓");
  assert.equal(getTemplatePreviewText({ type: "text", textKind: "static", text: "库位" }), "库位");
});
