import * as fieldRepository from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";

export async function listFields(moduleCode) {
  const rows = await fieldRepository.listFields(moduleCode);
  return rows.map(toDto);
}

export async function createField(moduleCode, payload = {}) {
  const field = normalizeField(payload, { requireCode: true });
  try {
    const created = await fieldRepository.createField(moduleCode, field);
    return toDto(created);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      throw appError(`字段编码「${field.code}」已存在，请更换编码或启用已停用的字段`, 40001, 409);
    }
    throw error;
  }
}

export async function updateField(moduleCode, fieldCode, payload = {}) {
  const field = normalizeField(payload, { requireCode: false });
  const updated = await fieldRepository.updateField(moduleCode, fieldCode, field);
  if (!updated) throw appError("字段不存在", 40400, 404);
  return toDto(updated);
}

export async function disableField(moduleCode, fieldCode) {
  const references = await fieldRepository.countFieldReferences(moduleCode, fieldCode);
  if (references > 0) throw appError("字段已被模板引用，不能停用", 40002, 409, { references });
  const affectedRows = await fieldRepository.disableField(moduleCode, fieldCode);
  if (!affectedRows) throw appError("字段不存在", 40400, 404);
  return { disabled: true };
}

export async function enableField(moduleCode, fieldCode) {
  const affectedRows = await fieldRepository.enableField(moduleCode, fieldCode);
  if (!affectedRows) throw appError("字段不存在", 40400, 404);
  return { enabled: true };
}

export async function deleteField(moduleCode, fieldCode) {
  const field = await fieldRepository.getField(moduleCode, fieldCode);
  if (!field) throw appError("字段不存在", 40400, 404);
  if (field.is_required) throw appError("必填字段不允许删除，请先取消必填或停用该字段", 40002, 409);
  const references = await fieldRepository.countFieldReferences(moduleCode, fieldCode);
  if (references > 0) throw appError("字段已被模板引用，不能删除", 40002, 409, { references });
  const affectedRows = await fieldRepository.deleteField(moduleCode, fieldCode);
  if (!affectedRows) throw appError("字段不存在", 40400, 404);
  return { deleted: true };
}

export function normalizeField(payload = {}, { requireCode } = {}) {
  const code = String(payload.code || "").trim();
  const name = String(payload.name || "").trim();
  const type = String(payload.type || "string").trim();
  if (requireCode && !/^[A-Za-z][A-Za-z0-9_]{1,63}$/.test(code)) {
    throw appError("字段编码需以字母开头，仅支持字母、数字、下划线，长度 2-64", 40000, 400);
  }
  if (!name) throw appError("字段名称不能为空", 40000, 400);
  if (!["string", "number", "integer", "date", "select"].includes(type)) {
    throw appError("字段类型不支持", 40000, 400);
  }
  return {
    code,
    name,
    type,
    example: String(payload.example || "").trim(),
    required: Boolean(payload.required),
    desc: String(payload.desc || payload.description || "").trim(),
    sortNo: Number(payload.sortNo ?? payload.sort_no ?? 0) || 0,
    searchable: Boolean(payload.searchable),
    sortable: Boolean(payload.sortable),
  };
}

function toDto(row) {
  return {
    code: row.field_code,
    name: row.field_name,
    type: row.field_type,
    example: row.example_value,
    required: Boolean(row.is_required),
    desc: row.description,
    sortNo: Number(row.sort_no || 0),
    enabled: row.enabled !== 0,
    searchable: Boolean(row.searchable),
    sortable: Boolean(row.sortable),
  };
}
