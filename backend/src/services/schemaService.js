import * as businessModuleRepository from "../repositories/businessModuleRepository.js";
import * as fieldRepository from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";

export async function compileSchema(moduleCode) {
  const code = String(moduleCode || "").toUpperCase();
  const mod = await businessModuleRepository.getModule(code);
  if (!mod || !mod.enabled) throw appError(`业务模块不存在或已停用：${moduleCode}`, 40000, 400);

  const rows = await fieldRepository.listFields(code);
  const allFields = rows.map((r) => ({
    code: r.field_code,
    name: r.field_name,
    type: r.field_type,
    required: Boolean(r.is_required),
    sortNo: Number(r.sort_no || 0),
    searchable: Boolean(r.searchable),
    sortable: Boolean(r.sortable),
    unique: Boolean(r.is_unique),
    bindableInTemplate: r.bindable_in_template !== 0,
    enabled: Boolean(r.enabled),
  })).sort((a, b) => a.sortNo - b.sortNo);

  const fields = allFields.filter((f) => f.enabled);

  // 主编码字段从启用字段中查找，找不到则回退到唯一字段或首个字段
  let recordCodeField = fields.find((f) => f.code === mod.record_code_field);
  if (!recordCodeField) {
    // Fallback: use any unique field, or the first enabled field
    recordCodeField = fields.find((f) => f.unique) || fields[0];
    if (!recordCodeField) throw appError(`模块 ${code} 没有可用字段`, 50000, 500);
    console.warn(`模块 ${code} 的主编码字段 ${mod.record_code_field} 未启用，已回退使用 ${recordCodeField.code}`);
  }

  return {
    module: {
      code: mod.module_code,
      name: mod.module_name,
      label: mod.data_label,
      recordCodeField: mod.record_code_field,
    },
    fields,
    recordCodeField,
    searchableFields: fields.filter((f) => f.searchable),
    sortableFields: fields.filter((f) => f.sortable),
    uniqueFields: fields.filter((f) => f.unique),
    bindableFields: fields.filter((f) => f.bindableInTemplate),
  };
}

export async function listModuleSchemas() {
  const modules = await businessModuleRepository.listEnabledModules();
  return modules.map((m) => ({
    code: m.module_code,
    name: m.module_name,
    label: m.data_label,
    recordCodeField: m.record_code_field,
  }));
}
