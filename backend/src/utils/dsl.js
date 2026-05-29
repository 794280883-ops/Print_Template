const SUPPORTED_TYPES = ["text", "qrcode", "barcode", "image", "line", "rect", "checkbox"];

export function toTemplateDsl(template, elements = [], warehouses = []) {
  return {
    id: String(template.id),
    dslVersion: "1.0",
    templateCode: template.template_code,
    templateName: template.template_name,
    templateType: template.template_type,
    areaWarehouseCodes: warehouses.map((item) => item.warehouse_code),
    size: {
      width: Number(template.width_mm),
      height: Number(template.height_mm),
      unit: template.unit,
      dpi: Number(template.dpi),
    },
    version: template.version,
    status: template.status,
    isDefault: Boolean(template.is_default),
    remark: template.remark || "",
    updatedAt: template.updated_at,
    elements: elements.map(toElementDsl),
  };
}

export function toElementDsl(row) {
  const extra = parseJson(row.extra_json, {});
  return {
    id: row.element_uid,
    type: row.element_type,
    x: Number(row.x),
    y: Number(row.y),
    width: Number(row.width),
    height: Number(row.height),
    zIndex: row.z_index,
    rotate: row.rotate,
    textKind: row.text_kind,
    text: row.text_content,
    bindField: row.bind_field,
    fontSize: row.font_size,
    bold: Boolean(row.bold),
    align: row.align_type,
    color: row.color,
    backgroundColor: row.background_color,
    imageUrl: row.image_url,
    ...extra,
  };
}

export function normalizeTemplateInput(input) {
  const size = input.size || {};
  return {
    templateCode: input.templateCode,
    templateName: input.templateName,
    templateType: input.templateType,
    areaWarehouseCodes: Array.isArray(input.areaWarehouseCodes) ? input.areaWarehouseCodes : [],
    size: {
      width: Number(size.width || input.widthMm || 0),
      height: Number(size.height || input.heightMm || 0),
      unit: size.unit || "mm",
      dpi: Number(size.dpi || 203),
    },
    version: input.version || "V0",
    status: input.status || "draft",
    isDefault: Boolean(input.isDefault),
    remark: input.remark || "",
    elements: Array.isArray(input.elements) ? input.elements : [],
  };
}

export function validateTemplateDsl(template, fieldRows = []) {
  const errors = [];
  const fieldCodes = new Set(fieldRows.map((field) => field.field_code));

  if (!String(template.templateName || "").trim()) errors.push({ message: "模板名称为空" });
  if (!["LOCATION", "CONTAINER", "PRODUCT"].includes(template.templateType)) errors.push({ message: "模板类型不在 LOCATION / CONTAINER / PRODUCT 中" });
  if (Number(template.size?.width) <= 0 || Number(template.size?.height) <= 0) errors.push({ message: "尺寸宽高必须大于 0" });
  if (!Array.isArray(template.elements) || !template.elements.length) errors.push({ message: "画布内没有元素" });

  const ids = new Set();
  for (const element of template.elements || []) {
    if (ids.has(element.id)) errors.push({ message: `元素 id 重复：${element.id}`, elementId: element.id });
    ids.add(element.id);
    if (!SUPPORTED_TYPES.includes(element.type)) errors.push({ message: `组件类型不支持：${element.type}`, elementId: element.id });
    if (element.textKind === "field" && !element.bindField) errors.push({ message: "动态文本没有绑定字段", elementId: element.id });
    if (["qrcode", "barcode"].includes(element.type) && !element.bindField) errors.push({ message: `${element.type === "qrcode" ? "二维码" : "条码"}没有绑定字段`, elementId: element.id });
    if (element.bindField && !fieldCodes.has(element.bindField)) errors.push({ message: `字段 ${element.bindField} 不存在于当前模板类型字段字典`, elementId: element.id });

    const x2 = Number(element.x) + Number(element.width);
    const y2 = Number(element.y) + Number(element.height);
    const out = x2 <= 0 || y2 <= 0 || Number(element.x) >= Number(template.size?.width) || Number(element.y) >= Number(template.size?.height);
    if (out) errors.push({ message: "元素完全超出画布", elementId: element.id });
  }

  return { errors, canPublish: errors.length === 0 };
}

export function elementToRow(templateId, element) {
  const extra = { ...element };
  for (const key of ["id", "type", "x", "y", "width", "height", "zIndex", "rotate", "textKind", "text", "bindField", "fontSize", "bold", "align", "color", "backgroundColor", "imageUrl"]) {
    delete extra[key];
  }

  return {
    template_id: templateId,
    element_uid: element.id,
    element_type: element.type,
    x: Number(element.x || 0),
    y: Number(element.y || 0),
    width: Number(element.width || 1),
    height: Number(element.height || 1),
    z_index: Number(element.zIndex || 1),
    rotate: Number(element.rotate || 0),
    text_kind: element.textKind || null,
    text_content: element.text || null,
    bind_field: element.bindField || null,
    font_size: element.fontSize || null,
    bold: element.bold ? 1 : 0,
    align_type: element.align || null,
    color: element.color || null,
    background_color: element.backgroundColor || null,
    image_url: element.imageUrl || null,
    extra_json: JSON.stringify(extra),
  };
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
