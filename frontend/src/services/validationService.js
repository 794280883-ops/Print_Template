import { FIELD_DICT, SUPPORTED_TYPES } from "../data/constants.js";

export function validateTemplateDsl(templateDsl) {
  const errors = [];
  const warnings = [];
  const tips = [];
  const template = templateDsl || {};
  const fieldList = FIELD_DICT[template.templateType] || [];
  const fieldCodes = new Set(fieldList.map((field) => field.code));

  if (!String(template.templateName || "").trim()) errors.push({ message: "模板名称为空" });
  if (!["LOCATION", "CONTAINER", "PRODUCT"].includes(template.templateType)) errors.push({ message: "模板类型不在 LOCATION / CONTAINER / PRODUCT 中" });
  if (!template.size || Number(template.size.width) <= 0 || Number(template.size.height) <= 0) errors.push({ message: "尺寸宽高必须大于 0" });
  if (![0, 90, 180, 270].includes(Number(template.printRotation || 0))) errors.push({ message: "打印旋转角度必须为 0/90/180/270" });
  if (!Array.isArray(template.elements) || !template.elements.length) errors.push({ message: "画布内没有元素" });

  const ids = new Set();
  let hasCode = false;
  (template.elements || []).forEach((element) => {
    if (ids.has(element.id)) errors.push({ message: `元素 id 重复：${element.id}`, elementId: element.id });
    ids.add(element.id);
    if (!SUPPORTED_TYPES.includes(element.type)) errors.push({ message: `组件类型不支持：${element.type}`, elementId: element.id });
    if (element.type === "text" && element.textKind === "field" && !element.bindField) errors.push({ message: "动态文本没有绑定字段", elementId: element.id });
    if (["qrcode", "barcode"].includes(element.type) && !element.bindField) errors.push({ message: `${element.type === "qrcode" ? "二维码" : "条码"}没有绑定字段`, elementId: element.id });
    if (element.bindField && !fieldCodes.has(element.bindField)) errors.push({ message: `字段 ${element.bindField} 不存在于当前模板类型模版字段`, elementId: element.id });

    const x2 = Number(element.x) + Number(element.width);
    const y2 = Number(element.y) + Number(element.height);
    const completelyOut = x2 <= 0 || y2 <= 0 || Number(element.x) >= Number(template.size?.width) || Number(element.y) >= Number(template.size?.height);
    const partiallyOut = Number(element.x) < 0 || Number(element.y) < 0 || x2 > Number(template.size?.width) || y2 > Number(template.size?.height);
    if (completelyOut) errors.push({ message: "元素完全超出画布", elementId: element.id });
    else if (partiallyOut) warnings.push({ message: "元素部分超出画布", elementId: element.id });

    if (["qrcode", "barcode"].includes(element.type)) {
      hasCode = true;
      if (Number(element.width) < 12 || Number(element.height) < 12) warnings.push({ message: `${element.type === "qrcode" ? "二维码" : "条码"}宽高小于 12mm`, elementId: element.id });
    }
    if (element.type === "image" && !element.imageUrl) warnings.push({ message: "图片组件没有图片地址", elementId: element.id });
    if (element.type === "text" && Number(element.fontSize || 0) < 6) tips.push({ message: "字体小于 6px", elementId: element.id });
  });

  if (!hasCode) tips.push({ message: "模板没有二维码或条码" });
  return { errors, warnings, tips, canPublish: errors.length === 0 };
}
