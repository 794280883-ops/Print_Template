import { getBusinessDataMapping, listBusinessTypeConfigs } from "../config/businessDataMapping.js";
import * as businessDataRepo from "../repositories/businessDataRepository.js";
import { appError } from "../utils/response.js";

export function listBusinessTypes() {
  return listBusinessTypeConfigs().map((item) => ({
    code: item.code,
    label: item.label,
    fields: item.fields.map(({ code, name }) => ({ code, name })),
  }));
}

export async function listWarehouses(query = {}) {
  const mapping = query.bizType ? getRequiredMapping(query.bizType) : null;
  const mappings = mapping ? [mapping] : listBusinessTypeConfigs();
  return businessDataRepo.listWarehouses(mappings);
}

export async function searchBusinessData(query = {}) {
  const mapping = getRequiredMapping(query.bizType || query.type);
  return businessDataRepo.search(mapping, {
    keyword: String(query.keyword || "").trim(),
    warehouseCode: String(query.warehouseCode || "").trim(),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getBusinessDataDetail(bizType, bizCode) {
  const mapping = getRequiredMapping(bizType);
  const code = String(bizCode || "").trim();
  if (!code) throw appError("缺少业务编码", 40000, 400);
  const row = await businessDataRepo.getDetail(mapping, code);
  if (!row) throw appError("业务数据不存在", 40400, 404);
  return row;
}

export async function createBusinessData(payload = {}) {
  const mapping = getRequiredMapping(payload.bizType || payload.type);
  const fields = normalizeFields(mapping, payload.fields);
  try {
    return await businessDataRepo.create(mapping, fields);
  } catch (error) {
    throw normalizeWriteError(error);
  }
}

export async function updateBusinessData(bizType, bizCode, payload = {}) {
  const mapping = getRequiredMapping(bizType);
  const code = String(bizCode || "").trim();
  if (!code) throw appError("缺少业务编码", 40000, 400);
  const exists = await businessDataRepo.getDetail(mapping, code);
  if (!exists) throw appError("业务数据不存在", 40400, 404);
  const fields = normalizeFields(mapping, payload.fields);
  try {
    return await businessDataRepo.update(mapping, code, fields);
  } catch (error) {
    throw normalizeWriteError(error);
  }
}

export async function deleteBusinessData(bizType, bizCode) {
  const mapping = getRequiredMapping(bizType);
  const code = String(bizCode || "").trim();
  if (!code) throw appError("缺少业务编码", 40000, 400);
  const affectedRows = await businessDataRepo.remove(mapping, code);
  if (!affectedRows) throw appError("业务数据不存在", 40400, 404);
  return { deleted: true };
}

function getRequiredMapping(bizType) {
  const mapping = getBusinessDataMapping(bizType);
  if (!mapping) throw appError(`无效的业务类型：${bizType}，仅支持 LOCATION / CONTAINER / PRODUCT`, 40000, 400);
  return mapping;
}

function normalizeFields(mapping, fields = {}) {
  const result = {};
  for (const field of mapping.fields) {
    const value = String(fields[field.code] ?? "").trim();
    result[field.code] = value;
  }
  const codeField = mapping.fields.find((field) => field.column === mapping.bizCodeColumn);
  if (!codeField || !result[codeField.code]) throw appError(`${codeField?.name || "业务编码"}必填`, 40000, 400);
  for (const field of mapping.fields) {
    if (field.required && !result[field.code]) throw appError(`${field.name}必填`, 40000, 400);
  }
  return result;
}

function normalizeWriteError(error) {
  if (error?.code === "ER_DUP_ENTRY") return appError("业务编码已存在", 40001, 409);
  return error;
}
