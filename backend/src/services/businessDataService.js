import * as businessDataRepo from "../repositories/businessDataRepository.js";
import { listFields } from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";

const VALID_TYPES = ["LOCATION", "CONTAINER", "PRODUCT"];

function toDto(row) {
  return {
    id: String(row.id),
    businessType: row.business_type,
    businessCode: row.business_code,
    fields: typeof row.business_data === "string" ? JSON.parse(row.business_data) : row.business_data,
    updatedAt: row.updated_at,
  };
}

export async function listBusinessData(type, query = {}) {
  if (!type) throw appError("缺少业务类型参数 type", 40000, 400);
  const upperType = String(type).toUpperCase();
  if (!VALID_TYPES.includes(upperType)) throw appError(`无效的业务类型：${type}，仅支持 LOCATION / CONTAINER / PRODUCT`, 40000, 400);

  const { rows, total } = await businessDataRepo.listByType(upperType, {
    keyword: query.keyword || "",
    page: query.page || 1,
    pageSize: query.pageSize || 20,
  });

  return {
    rows: rows.map(toDto),
    total,
    page: Number(query.page) || 1,
    pageSize: Number(query.pageSize) || 20,
  };
}

export async function getBusinessData(id) {
  const row = await businessDataRepo.getById(id);
  if (!row) throw appError("业务数据不存在", 40400, 404);
  return toDto(row);
}

export async function createBusinessData(input) {
  const businessType = String(input.businessType || "").toUpperCase();
  if (!VALID_TYPES.includes(businessType)) throw appError("无效的业务类型", 40000, 400);

  const fields = await listFields(businessType);
  const data = input.businessData || {};

  // Validate required fields
  for (const field of fields) {
    if (field.is_required) {
      const value = data[field.field_code];
      if (value === undefined || value === null || String(value).trim() === "") {
        throw appError(`必填字段 [${field.field_name}] 不能为空`, 40000, 400);
      }
    }
  }

  // Derive business_code from the primary identifier field
  const primaryField = fields.find(f => f.is_required && f.sort_no <= 10);
  const businessCode = data[primaryField?.field_code] || input.businessCode;
  if (!businessCode || !String(businessCode).trim()) {
    throw appError("业务编码不能为空", 40000, 400);
  }

  // Check uniqueness
  const existing = await businessDataRepo.getByCode(businessType, String(businessCode).trim());
  if (existing) throw appError(`业务编码 [${businessCode}] 已存在`, 40001, 409);

  const row = await businessDataRepo.create({
    businessType,
    businessCode: String(businessCode).trim(),
    businessData: data,
  });

  return toDto(row);
}

export async function updateBusinessData(id, input) {
  const existing = await businessDataRepo.getById(id);
  if (!existing) throw appError("业务数据不存在", 40400, 404);

  const businessType = existing.business_type;
  const fields = await listFields(businessType);
  const data = input.businessData || {};

  // Validate required fields
  for (const field of fields) {
    if (field.is_required) {
      const value = data[field.field_code];
      if (value === undefined || value === null || String(value).trim() === "") {
        throw appError(`必填字段 [${field.field_name}] 不能为空`, 40000, 400);
      }
    }
  }

  // Derive business_code
  const primaryField = fields.find(f => f.is_required && f.sort_no <= 10);
  const businessCode = data[primaryField?.field_code] || input.businessCode;
  if (!businessCode || !String(businessCode).trim()) {
    throw appError("业务编码不能为空", 40000, 400);
  }

  // Check uniqueness (exclude current id)
  const dup = await businessDataRepo.getByCode(businessType, String(businessCode).trim());
  if (dup && Number(dup.id) !== Number(id)) {
    throw appError(`业务编码 [${businessCode}] 已存在`, 40001, 409);
  }

  const row = await businessDataRepo.update(id, {
    businessCode: String(businessCode).trim(),
    businessData: data,
  });

  return toDto(row);
}

export async function deleteBusinessData(id) {
  const existing = await businessDataRepo.getById(id);
  if (!existing) throw appError("业务数据不存在", 40400, 404);
  await businessDataRepo.remove(id);
  return { id: String(id) };
}
