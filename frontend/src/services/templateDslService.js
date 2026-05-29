import { FIELD_DICT } from "../data/constants.js";

export function sampleByType(type) {
  return Object.fromEntries((FIELD_DICT[type] || []).map((field) => [field.code, field.example]));
}

export function fieldExists(type, code) {
  return (FIELD_DICT[type] || []).some((field) => field.code === code);
}

export function toDsl(template) {
  return {
    dslVersion: "1.0",
    templateCode: template.templateCode,
    templateName: template.templateName,
    templateType: template.templateType,
    size: template.size,
    areaWarehouseCodes: template.areaWarehouseCodes || [],
    elements: template.elements,
  };
}

export function fromDsl(raw, uid, nowText) {
  return {
    id: raw.id || uid("tpl"),
    dslVersion: raw.dslVersion || "1.0",
    templateCode: raw.templateCode || `TPL_IMPORT_${Date.now().toString().slice(-6)}`,
    templateName: raw.templateName || "导入模板",
    templateType: raw.templateType,
    areaWarehouseCodes: raw.areaWarehouseCodes || [],
    size: raw.size || { width: 100, height: 50, unit: "mm", dpi: 203 },
    version: "V0",
    status: "draft",
    isDefault: false,
    remark: "JSON 导入草稿",
    updatedAt: nowText(),
    elements: (raw.elements || []).map((element) => ({
      textKind: "static",
      fontSize: 12,
      align: "left",
      color: "#111827",
      backgroundColor: "transparent",
      ...element,
    })),
  };
}
