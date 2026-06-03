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

function getRequiredMapping(bizType) {
  const mapping = getBusinessDataMapping(bizType);
  if (!mapping) throw appError(`无效的业务类型：${bizType}，仅支持 LOCATION / CONTAINER / PRODUCT`, 40000, 400);
  return mapping;
}
