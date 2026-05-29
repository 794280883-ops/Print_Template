export async function generateTemplateDraft(payload) {
  const type = String(payload.templateType || payload.type || "").toUpperCase() === "CONTAINER" || String(payload.prompt || "").includes("容器") ? "CONTAINER" : "LOCATION";
  const now = Date.now().toString().slice(-6);
  const base = {
    dslVersion: "1.0",
    templateCode: `TPL_AI_${type}_${now}`,
    templateName: type === "CONTAINER" ? "容器标签-10x5cm-AI草稿" : "库位标签-10x5cm-AI草稿",
    templateType: type,
    areaWarehouseCodes: [],
    size: { width: 100, height: 50, unit: "mm", dpi: 203 },
    version: "V0",
    status: "draft",
    isDefault: false,
    remark: "AI mock 生成，需人工确认",
  };

  if (type === "CONTAINER") {
    return {
      ...base,
      elements: [
        { id: "ai_title", type: "text", textKind: "static", text: "CONTAINER", x: 6, y: 4, width: 88, height: 8, fontSize: 16, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
        { id: "ai_code", type: "text", textKind: "field", x: 8, y: 15, width: 62, height: 12, bindField: "containerCode", fontSize: 22, bold: true, align: "left", color: "#111827", backgroundColor: "transparent" },
        { id: "ai_qr", type: "qrcode", x: 74, y: 16, width: 18, height: 18, bindField: "containerCode" },
      ],
    };
  }

  return {
    ...base,
    elements: [
      { id: "ai_main", type: "text", textKind: "field", x: 14, y: 5, width: 72, height: 12, bindField: "locationCode", fontSize: 30, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
      { id: "ai_prefix", type: "text", textKind: "field", x: 6, y: 6, width: 15, height: 7, bindField: "locationPrefix", fontSize: 11, bold: true, align: "left", color: "#111827", backgroundColor: "transparent" },
      { id: "ai_qr", type: "qrcode", x: 8, y: 23, width: 20, height: 20, bindField: "locationCode" },
      { id: "ai_direction", type: "text", textKind: "field", x: 64, y: 24, width: 26, height: 14, bindField: "directionMark", fontSize: 24, bold: true, align: "center", color: "#ffffff", backgroundColor: "#111827" },
    ],
  };
}
