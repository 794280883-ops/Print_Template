export function normalizeTemplateType(templateType) {
  return String(templateType || "").trim().toUpperCase();
}

export async function loadTemplateForDesigner(id, { getTemplate, fetchFields }) {
  const template = await getTemplate(id);
  const templateType = normalizeTemplateType(template.templateType);
  await fetchFields(templateType);
  return { ...template, templateType };
}

export function resolveTemplateFields(templateType, fieldsByType, fallbackFields) {
  const normalizedType = normalizeTemplateType(templateType);
  return fieldsByType[normalizedType] || fallbackFields[normalizedType] || [];
}
