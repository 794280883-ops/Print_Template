import { nowText } from "./timeService.js";

export function parseAiPromptToTemplate(prompt, selectedType, uid) {
  const lower = String(prompt || "").toLowerCase();
  const type = lower.includes("商品") || lower.includes("product") || lower.includes("sku")
    ? "PRODUCT"
    : lower.includes("容器") || lower.includes("container")
      ? "CONTAINER"
      : lower.includes("库位") || lower.includes("location")
        ? "LOCATION"
        : selectedType;
  if (type === "PRODUCT") return createProductTemplateFromPrompt(prompt, uid);
  return type === "CONTAINER" ? createContainerTemplateFromPrompt(prompt, uid) : createLocationTemplateFromPrompt(prompt, uid);
}

export function createLocationTemplateFromPrompt(prompt, uid) {
  const text = String(prompt || "");
  const big = /大字|加粗/.test(text);
  const black = /黑底白字/.test(text);
  const elements = [
    { id: uid("main"), type: "text", textKind: "field", x: 14, y: 5, width: 72, height: 12, bindField: "locationCode", fontSize: big ? 30 : 26, bold: big, align: "center", color: "#111827", backgroundColor: "transparent" },
  ];
  if (/前缀/.test(text) || true) elements.push({ id: uid("prefix"), type: "text", textKind: "field", x: 6, y: 6, width: 15, height: 7, bindField: "locationPrefix", fontSize: 11, bold: true, align: "left", color: "#111827", backgroundColor: "transparent" });
  if (/二维码/.test(text) || !/条码/.test(text)) elements.push({ id: uid("qr"), type: "qrcode", x: 8, y: 23, width: 20, height: 20, bindField: "locationCode" });
  if (/条码/.test(text)) elements.push({ id: uid("bar"), type: "barcode", x: 30, y: 28, width: 44, height: 12, bindField: "locationCode" });
  if (/方向标/.test(text)) elements.push({ id: uid("direction"), type: "text", textKind: "field", x: 64, y: 24, width: 26, height: 14, bindField: "directionMark", fontSize: 24, bold: true, align: "center", color: black ? "#ffffff" : "#111827", backgroundColor: black ? "#111827" : "transparent" });
  return {
    id: uid("tpl"),
    dslVersion: "1.0",
    templateCode: `TPL_AI_LOCATION_${Date.now().toString().slice(-6)}`,
    templateName: "库位标签-10x5cm-AI草稿",
    templateType: "LOCATION",
    areaWarehouseCodes: [],
    size: { width: 100, height: 50, unit: "mm", dpi: 203 },
    version: "V0",
    status: "draft",
    isDefault: false,
    remark: "AI mock 生成，需人工确认",
    updatedAt: nowText(),
    elements,
    aiNotice: "AI 生成内容需人工确认后发布",
  };
}

export function createContainerTemplateFromPrompt(prompt, uid) {
  const text = String(prompt || "");
  const big = /大字|加粗/.test(text);
  const black = /黑底白字/.test(text);
  const elements = [
    { id: uid("title"), type: "text", textKind: "static", text: "CONTAINER", x: 6, y: 4, width: 88, height: 8, fontSize: 16, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
    { id: uid("code"), type: "text", textKind: "field", x: 8, y: 15, width: 62, height: 12, bindField: "containerCode", fontSize: big ? 26 : 22, bold: big, align: "left", color: black ? "#ffffff" : "#111827", backgroundColor: black ? "#111827" : "transparent" },
    { id: uid("warehouse"), type: "text", textKind: "field", x: 8, y: 32, width: 36, height: 7, bindField: "warehouseCode", fontSize: 10, bold: false, align: "left", color: "#111827", backgroundColor: "transparent" },
    { id: uid("purpose"), type: "text", textKind: "field", x: 8, y: 40, width: 36, height: 6, bindField: "purpose", fontSize: 9, bold: false, align: "left", color: "#111827", backgroundColor: "transparent" },
  ];
  if (/二维码/.test(text) || !/条码/.test(text)) elements.push({ id: uid("qr"), type: "qrcode", x: 74, y: 16, width: 18, height: 18, bindField: "containerCode" });
  if (/条码/.test(text)) elements.push({ id: uid("bar"), type: "barcode", x: 8, y: 39, width: 55, height: 8, bindField: "containerCode" });
  return {
    id: uid("tpl"),
    dslVersion: "1.0",
    templateCode: `TPL_AI_CONTAINER_${Date.now().toString().slice(-6)}`,
    templateName: "容器标签-10x5cm-AI草稿",
    templateType: "CONTAINER",
    areaWarehouseCodes: [],
    size: { width: 100, height: 50, unit: "mm", dpi: 203 },
    version: "V0",
    status: "draft",
    isDefault: false,
    remark: "AI mock 生成，需人工确认",
    updatedAt: nowText(),
    elements,
    aiNotice: "AI 生成内容需人工确认后发布",
  };
}

export function createProductTemplateFromPrompt(prompt, uid) {
  const text = String(prompt || "");
  const big = /大字|加粗/.test(text);
  const elements = [
    { id: uid("code"), type: "text", textKind: "field", x: 3, y: 8, width: 24, height: 10, bindField: "productCode", fontSize: big ? 18 : 16, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
    { id: uid("customer"), type: "text", textKind: "field", x: 3, y: 22, width: 24, height: 8, bindField: "customerProductCode", fontSize: 10, bold: false, align: "center", color: "#334155", backgroundColor: "transparent" },
  ];
  if (/二维码/.test(text) || !/条码/.test(text)) elements.push({ id: uid("qr"), type: "qrcode", x: 6, y: 36, width: 18, height: 18, bindField: "productCode" });
  if (/条码/.test(text)) elements.push({ id: uid("bar"), type: "barcode", x: 3, y: 38, width: 24, height: 12, bindField: "productCode" });
  return {
    id: uid("tpl"),
    dslVersion: "1.0",
    templateCode: `TPL_AI_PRODUCT_${Date.now().toString().slice(-6)}`,
    templateName: "商品标签-30x70mm-AI草稿",
    templateType: "PRODUCT",
    areaWarehouseCodes: [],
    size: { width: 30, height: 70, unit: "mm", dpi: 203 },
    version: "V0",
    status: "draft",
    isDefault: false,
    remark: "AI mock 生成，需人工确认",
    updatedAt: nowText(),
    elements,
    aiNotice: "AI 生成内容需人工确认后发布",
  };
}
