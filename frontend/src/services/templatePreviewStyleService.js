import { PX_PER_MM } from "../data/constants.js";
import {
  getBarcodeBarStyle as getBarcodeBarStyleBase,
  getBarcodeHumanTextFontSize,
} from "./barcodeHumanTextService.js";

export function getTemplatePreviewScale(template, { maxScale = 1.3, maxWidth = 300, fallbackScale = 1 } = {}) {
  const width = Number(template?.size?.width || 0) * PX_PER_MM;
  if (!width) return fallbackScale;
  return Math.min(maxScale, maxWidth / width);
}

export function getTemplatePreviewCanvasStyle(template, options = {}) {
  if (!template) return {};
  const scale = getTemplatePreviewScale(template, options);
  return {
    width: `${template.size.width * PX_PER_MM * scale}px`,
    height: `${template.size.height * PX_PER_MM * scale}px`,
  };
}

export function getTemplatePreviewElementStyle(element, template, options = {}) {
  if (!template) return {};
  const scale = getTemplatePreviewScale(template, options);
  return {
    left: `${element.x * PX_PER_MM * scale}px`,
    top: `${element.y * PX_PER_MM * scale}px`,
    width: `${element.width * PX_PER_MM * scale}px`,
    height: `${element.height * PX_PER_MM * scale}px`,
    zIndex: element.zIndex || 1,
    fontSize: `${(element.fontSize || 12) * scale}px`,
    fontWeight: element.bold ? 700 : 400,
    color: element.color || "#111827",
    background: element.type === "line" ? (element.color || "#111827") : (element.backgroundColor || "transparent"),
    transform: `rotate(${element.rotate || 0}deg)`,
  };
}

export function getTemplatePreviewBarcodeHumanTextStyle(element, template, options = {}) {
  const scale = template ? getTemplatePreviewScale(template, options) : 1;
  return {
    fontSize: `${getBarcodeHumanTextFontSize(element, scale)}px`,
    marginTop: `${2 * scale}px`,
  };
}

export function getTemplatePreviewBarcodeBarStyle(element, template, options = {}) {
  const scale = template ? getTemplatePreviewScale(template, options) : 1;
  return getBarcodeBarStyleBase(element, scale);
}

export function getTemplatePreviewText(element) {
  if (element.type !== "text") return "";
  if (element.textKind === "field") {
    if (element.bindField === "directionMark") return "↑↓";
    return `[${element.bindField || "未绑定"}]`;
  }
  return element.text || "静态文本";
}
