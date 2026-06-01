import { listFields } from "../repositories/fieldRepository.js";
import * as operationLogRepository from "../repositories/operationLogRepository.js";
import * as templateRepository from "../repositories/templateRepository.js";
import { appError } from "../utils/response.js";
import { normalizeTemplateInput, validateTemplateDsl } from "../utils/dsl.js";

export async function listTemplates(filters) {
  return templateRepository.listTemplates(filters);
}

export async function listOperationLogs() {
  return operationLogRepository.listOperationLogs();
}

export async function getTemplate(id) {
  const template = await templateRepository.getTemplateById(id);
  if (!template) throw appError("模板不存在", 40400, 404);
  return template;
}

export async function recordDesignLog(id) {
  const template = await getTemplate(id);
  await operationLogRepository.addOperationLog({
    actionName: "进入模板设计",
    targetId: template.id,
    targetName: template.templateName,
    afterJson: { templateCode: template.templateCode, templateType: template.templateType },
  });
  return { id: template.id, templateCode: template.templateCode, templateName: template.templateName };
}

export async function createTemplate(input) {
  const template = normalizeTemplateInput(input);
  await ensureTemplateCodeUnique(template.templateCode);
  await ensureTemplateNameUnique(template.templateName);
  const created = await templateRepository.createTemplate(template);
  await operationLogRepository.addOperationLog({ actionName: "新增模板", targetId: created.id, targetName: created.templateName, afterJson: created });
  return created;
}

export async function updateTemplate(id, input) {
  await getTemplate(id);
  const template = normalizeTemplateInput(input);
  const duplicatedCode = await templateRepository.getTemplateRowByCode(template.templateCode);
  if (duplicatedCode && Number(duplicatedCode.id) !== Number(id)) throw appError("模板编码重复", 40001, 409);
  const duplicatedName = await templateRepository.getTemplateRowByName(template.templateName);
  if (duplicatedName && Number(duplicatedName.id) !== Number(id)) throw appError("模板名称重复", 40003, 409);
  const updated = await templateRepository.replaceTemplate(id, template);
  await operationLogRepository.addOperationLog({ actionName: "保存草稿", targetId: updated.id, targetName: updated.templateName, afterJson: updated });
  return updated;
}

export async function updateTemplateName(id, input) {
  const before = await getTemplate(id);
  const templateName = String(input.templateName || input.name || "").trim();
  if (!templateName) throw appError("模板名称不能为空", 40000, 400);
  const duplicated = await templateRepository.getTemplateRowByName(templateName);
  if (duplicated && Number(duplicated.id) !== Number(id)) throw appError("模板名称重复", 40003, 409);
  const updated = await templateRepository.updateTemplateName(id, templateName);
  await operationLogRepository.addOperationLog({
    actionName: "编辑模板名称",
    targetId: updated.id,
    targetName: updated.templateName,
    beforeJson: { templateName: before.templateName },
    afterJson: { templateName: updated.templateName },
  });
  return updated;
}

export async function publishTemplate(id) {
  const template = await getTemplate(id);
  const fields = await listFields(template.templateType);
  const result = validateTemplateDsl(template, fields);
  if (result.errors.length) throw appError("DSL 校验失败", 40002, 400, result);
  const version = template.status === "published" ? nextVersion(template.version) : template.version === "V0" ? "V1" : template.version;
  const updated = await templateRepository.updateTemplateStatus(id, "published", version);
  await operationLogRepository.addOperationLog({ actionName: "发布模板", targetId: updated.id, targetName: updated.templateName, beforeJson: template, afterJson: updated });
  return updated;
}

export async function disableTemplate(id) {
  const template = await getTemplate(id);
  const nextStatus = template.status === "disabled" ? "draft" : "disabled";
  const updated = await templateRepository.updateTemplateStatus(id, nextStatus);
  await operationLogRepository.addOperationLog({ actionName: nextStatus === "disabled" ? "停用模板" : "启用为草稿", targetId: updated.id, targetName: updated.templateName, beforeJson: template, afterJson: updated });
  return updated;
}

export async function copyTemplate(id) {
  const template = await getTemplate(id);
  const copy = {
    ...template,
    templateCode: `TPL_COPY_${Date.now().toString().slice(-6)}`,
    templateName: `${template.templateName}-副本`,
    version: "V0",
    status: "draft",
    isDefault: false,
    areaWarehouseCodes: [],
    elements: template.elements.map((element) => ({ ...element, id: `${element.type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}` })),
  };
  const created = await templateRepository.createTemplate(normalizeTemplateInput(copy));
  await operationLogRepository.addOperationLog({ actionName: "复制模板", targetId: created.id, targetName: created.templateName, beforeJson: template, afterJson: created });
  return created;
}

export async function importTemplate(input) {
  const template = normalizeTemplateInput({
    ...input,
    templateCode: input.templateCode || `TPL_IMPORT_${Date.now().toString().slice(-6)}`,
    templateName: `${input.templateName || "导入模板"}-导入草稿`,
    version: "V0",
    status: "draft",
    isDefault: false,
  });
  await ensureTemplateCodeUnique(template.templateCode);
  const created = await templateRepository.createTemplate(template);
  await operationLogRepository.addOperationLog({ actionName: "导入 JSON", targetId: created.id, targetName: created.templateName, afterJson: created });
  return created;
}

export async function exportTemplate(id) {
  const template = await getTemplate(id);
  return {
    dslVersion: "1.0",
    templateCode: template.templateCode,
    templateName: template.templateName,
    templateType: template.templateType,
    size: template.size,
    areaWarehouseCodes: template.areaWarehouseCodes,
    elements: template.elements,
  };
}

export async function deleteTemplate(id) {
  const template = await getTemplate(id);
  await templateRepository.deleteTemplate(id);
  await operationLogRepository.addOperationLog({
    actionName: "删除模板",
    targetId: template.id,
    targetName: template.templateName,
    beforeJson: template,
  });
  return { id: template.id, templateCode: template.templateCode, templateName: template.templateName };
}

async function ensureTemplateCodeUnique(templateCode) {
  if (!templateCode) throw appError("模板编码不能为空", 40000, 400);
  const duplicated = await templateRepository.getTemplateRowByCode(templateCode);
  if (duplicated) throw appError("模板编码重复", 40001, 409);
}

async function ensureTemplateNameUnique(templateName) {
  if (!templateName) throw appError("模板名称不能为空", 40000, 400);
  const duplicated = await templateRepository.getTemplateRowByName(templateName);
  if (duplicated) throw appError("模板名称重复", 40003, 409);
}

function nextVersion(version) {
  return `V${Number(String(version || "V1").replace("V", "")) + 1}`;
}
