import { listFields } from "../repositories/fieldRepository.js";
import * as operationLogRepository from "../repositories/operationLogRepository.js";
import * as templateRepository from "../repositories/templateRepository.js";
import { appError } from "../utils/response.js";
import { normalizeTemplateInput, validateTemplateDsl } from "../utils/dsl.js";

export async function listTemplates(filters) {
  return templateRepository.listTemplates(filters);
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
  await operationLogRepository.addOperationLog({ actionName: "保存模板", targetId: updated.id, targetName: updated.templateName, afterJson: updated });
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

export async function enableTemplate(id) {
  const template = await getTemplate(id);
  const fields = await listFields(template.templateType);
  const result = validateTemplateDsl(template, fields);
  if (result.errors.length) throw appError("DSL 校验失败", 40002, 400, result);
  const updated = await templateRepository.updateTemplateStatus(id, "enabled");
  await operationLogRepository.addOperationLog({ actionName: "启用模板", targetId: updated.id, targetName: updated.templateName, beforeJson: template, afterJson: updated });
  return updated;
}

export async function disableTemplate(id) {
  const template = await getTemplate(id);
  const updated = await templateRepository.updateTemplateStatus(id, "disabled");
  await operationLogRepository.addOperationLog({ actionName: "停用模板", targetId: updated.id, targetName: updated.templateName, beforeJson: template, afterJson: updated });
  return updated;
}

export async function updateTemplatesStatus(input) {
  const ids = Array.isArray(input.ids) ? input.ids.filter(Boolean) : [];
  const status = String(input.status || "");
  if (!ids.length) throw appError("请选择模板", 40000, 400);
  if (!["enabled", "disabled"].includes(status)) throw appError("状态值必须为 enabled/disabled", 40000, 400);

  const templates = [];
  for (const id of ids) {
    const template = await getTemplate(id);
    templates.push(template);
    if (status === "enabled") {
      const fields = await listFields(template.templateType);
      const result = validateTemplateDsl(template, fields);
      if (result.errors.length) throw appError(`模板「${template.templateName}」校验失败，不能启用`, 40002, 400, result);
    }
  }

  const updated = [];
  for (const template of templates) {
    const next = await templateRepository.updateTemplateStatus(template.id, status);
    await operationLogRepository.addOperationLog({
      actionName: status === "enabled" ? "启用模板" : "停用模板",
      targetId: next.id,
      targetName: next.templateName,
      beforeJson: template,
      afterJson: next,
    });
    updated.push(next);
  }
  return updated;
}

export async function copyTemplate(id) {
  const template = await getTemplate(id);
  const copy = {
    ...template,
    templateCode: `TPL_COPY_${Date.now().toString().slice(-6)}`,
    templateName: `${template.templateName}-副本`,
    status: "disabled",
    elements: template.elements.map((element) => ({ ...element, id: `${element.type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}` })),
  };
  const created = await templateRepository.createTemplate(normalizeTemplateInput(copy));
  await operationLogRepository.addOperationLog({ actionName: "复制模板", targetId: created.id, targetName: created.templateName, beforeJson: template, afterJson: created });
  return created;
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
