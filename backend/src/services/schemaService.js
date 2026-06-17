import * as businessModuleRepository from "../repositories/businessModuleRepository.js";
import * as fieldRepository from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";

export async function compileSchema(moduleCode) {
  const code = String(moduleCode || "").toUpperCase();
  const mod = await businessModuleRepository.getModule(code);
  if (!mod || !mod.enabled) throw appError(`业务模块不存在或已停用：${moduleCode}`, 40000, 400);

  const rows = await fieldRepository.listFields(code);
  const fields = rows.filter((r) => r.enabled).map((r) => ({
    code: r.field_code,
    name: r.field_name,
    type: r.field_type,
    required: Boolean(r.is_required),
    sortNo: Number(r.sort_no || 0),
    searchable: Boolean(r.searchable),
    sortable: Boolean(r.sortable),
    bindableInTemplate: r.bindable_in_template !== 0,
  }));

  const recordCodeField = fields.find((f) => f.code === mod.record_code_field);
  if (!recordCodeField) throw appError(`模块 ${code} 的主编码字段不存在`, 50000, 500);

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
