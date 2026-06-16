import * as fieldRepository from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";

export async function listFields(templateType) {
  const rows = await fieldRepository.listFields(templateType);
  return rows.map(toDto);
}

export async function createField(templateType, payload = {}) {
  const field = normalizeField(payload, { requireCode: true });
  const created = await fieldRepository.createField(templateType, field);
  return toDto(created);
}

export async function updateField(templateType, fieldCode, payload = {}) {
  const field = normalizeField(payload, { requireCode: false });
  const updated = await fieldRepository.updateField(templateType, fieldCode, field);
  if (!updated) throw appError("字段不存在", 40400, 404);
  return toDto(updated);
}

export async function disableField(templateType, fieldCode) {
  const references = await fieldRepository.countFieldReferences(templateType, fieldCode);
  if (references > 0) throw appError("字段已被模板引用，不能停用", 40002, 409, { references });
  const affectedRows = await fieldRepository.disableField(templateType, fieldCode);
  if (!affectedRows) throw appError("字段不存在", 40400, 404);
  return { disabled: true };
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
  };
}
