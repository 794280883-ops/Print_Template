import { getBusinessDataMapping, listBusinessTypeConfigs } from "../config/businessDataMapping.js";
import * as businessModuleRepository from "../repositories/businessModuleRepository.js";
import * as businessDataRepo from "../repositories/businessDataRepository.js";
import * as fieldRepository from "../repositories/fieldRepository.js";
import { appError } from "../utils/response.js";
import XLSX from "xlsx";

export async function listBusinessTypes() {
  const modules = await businessModuleRepository.listEnabledModules();
  return modules.map((item) => ({
    code: item.module_code,
    label: item.data_label,
    fields: [],
  }));
}

export async function listWarehouses(query = {}) {
  const mapping = query.bizType ? await getRequiredMapping(query.bizType) : null;
  const mappings = mapping ? [mapping] : listBusinessTypeConfigs();
  return businessDataRepo.listWarehouses(mappings);
}

export async function searchBusinessData(query = {}) {
  const mapping = await getRequiredMapping(query.bizType || query.type);
  return businessDataRepo.search(mapping, {
    keyword: String(query.keyword || "").trim(),
    warehouseCode: String(query.warehouseCode || "").trim(),
    page: query.page,
    pageSize: query.pageSize,
    sortField: query.sortField,
    sortDir: query.sortDir,
  });
}

export async function getBusinessDataDetail(bizType, bizCode) {
  const mapping = await getRequiredMapping(bizType);
  const code = String(bizCode || "").trim();
  if (!code) throw appError("缺少业务编码", 40000, 400);
  const row = await businessDataRepo.getDetail(mapping, code);
  if (!row) throw appError("业务数据不存在", 40400, 404);
  return row;
}

export async function createBusinessData(payload = {}) {
  const mapping = await getRequiredMapping(payload.bizType || payload.type);
  const fields = normalizeFields(mapping, payload.fields);
  try {
    return await businessDataRepo.create(mapping, fields);
  } catch (error) {
    throw normalizeWriteError(error);
  }
}

export async function updateBusinessData(bizType, bizCode, payload = {}) {
  const mapping = await getRequiredMapping(bizType);
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
  const mapping = await getRequiredMapping(bizType);
  const code = String(bizCode || "").trim();
  if (!code) throw appError("缺少业务编码", 40000, 400);
  const affectedRows = await businessDataRepo.remove(mapping, code);
  if (!affectedRows) throw appError("业务数据不存在", 40400, 404);
  return { deleted: true };
}

async function getRequiredMapping(bizType) {
  const code = String(bizType || "").toUpperCase();
  const mapping = getBusinessDataMapping(code);
  if (mapping) return mapping;

  const module = await businessModuleRepository.getModule(code);
  if (!module || !module.enabled) throw appError(`业务模块不存在或已停用：${bizType}`, 40000, 400);

  const fieldRows = await fieldRepository.listFields(code);
  const fields = fieldRows.map((row) => ({
    code: row.field_code,
    name: row.field_name,
    source: "json",
    path: `$.${row.field_code}`,
    required: Boolean(row.is_required),
  }));

  return {
    code: module.module_code,
    label: module.data_label,
    table: "business_data",
    typeColumn: "business_type",
    typeValue: module.module_code,
    bizCodeColumn: "business_code",
    codeField: module.code_field,
    updatedAtColumn: "updated_at",
    fieldsJsonColumn: "business_data",
    storageMode: "json_table",
    warehouse: null,
    keyword: fields.map((field) => ({ source: "json", path: field.path })),
    fields,
  };
}

function normalizeFields(mapping, fields = {}) {
  const result = {};
  for (const field of mapping.fields) {
    const value = String(fields[field.code] ?? "").trim();
    result[field.code] = value;
  }
  const codeField = mapping.storageMode === "json_table"
    ? mapping.fields.find((field) => field.code === mapping.codeField)
    : mapping.fields.find((field) => field.column === mapping.bizCodeColumn);
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

function friendlyImportError(err, excelRow, codeFieldName, bizCode) {
  const label = bizCode ? `${codeFieldName}[${bizCode}]` : `第${excelRow}行`;

  // 唯一键重复
  if (err?.code === "ER_DUP_ENTRY") {
    const dupMatch = String(err.message || "").match(/Duplicate entry '(.+?)'/);
    const dupValue = dupMatch ? dupMatch[1] : bizCode || "未知";
    return `第${excelRow}行${codeFieldName}[${dupValue}]已存在，请检查是否重复导入`;
  }

  // 数据过长
  if (err?.code === "ER_DATA_TOO_LONG") {
    return `第${excelRow}行${label}某个字段内容过长，超出数据库允许长度，请缩短后重试`;
  }

  // 必填校验（normalizeFields 已转为中文，补充行号）
  if (err?.message && err.message.includes("必填")) {
    return `第${excelRow}行${err.message}`;
  }

  // 无效业务类型等前置错误
  if (err?.message && err.message.includes("无效的业务类型")) {
    return err.message;
  }

  // 其他未知错误
  return `第${excelRow}行${label}导入失败：${err.message || "未知错误"}`;
}

export async function generateImportTemplate(bizType) {
  const mapping = await getRequiredMapping(bizType);

  // 表头使用字段中文名，列为 mapping.fields 的全量字段
  const headers = mapping.fields.map((f) => f.name);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);

  // 设置列宽
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));

  // 给必填字段的列头添加批注
  mapping.fields.forEach((field, colIndex) => {
    if (!field.required) return;
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    if (!worksheet[cellAddress]) return;
    if (!worksheet[cellAddress].c) {
      worksheet[cellAddress].c = [];
      worksheet[cellAddress].c.hidden = true;
    }
    worksheet[cellAddress].c.push({ a: "系统", t: "此字段为必填" });
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, mapping.label);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function importBusinessData(bizType, fileBuffer) {
  const mapping = await getRequiredMapping(bizType);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw appError("Excel 文件中没有工作表", 40000, 400);

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (rows.length < 2) throw appError("Excel 文件中没有数据行（至少需要表头 + 一行数据）", 40000, 400);

  // 第一行是表头，用中文名匹配 field
  const headerRow = rows[0].map((h) => String(h || "").trim());
  const colFieldMap = [];
  for (const header of headerRow) {
    const field = mapping.fields.find((f) => f.name === header);
    colFieldMap.push(field || null);
  }

  const codeColumnIndex = colFieldMap.findIndex((f) => f && isCodeField(mapping, f));
  if (codeColumnIndex < 0) {
    const codeField = mapping.fields.find((f) => isCodeField(mapping, f));
    throw appError(`Excel 表头中未找到"${codeField?.name || "编码"}"列`, 40000, 400);
  }

  const codeFieldName = mapping.fields.find((f) => isCodeField(mapping, f))?.name || "编码";
  const results = { total: 0, success: 0, errors: [] };

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    results.total++;

    const fields = {};
    let hasValue = false;
    for (let ci = 0; ci < colFieldMap.length; ci++) {
      const field = colFieldMap[ci];
      if (!field) continue;
      const value = String(row[ci] ?? "").trim();
      fields[field.code] = value;
      if (value) hasValue = true;
    }
    if (!hasValue) continue; // 跳过全空行

    const excelRow = rowIndex + 1; // Excel 中的行号（第1行是表头）
    const bizCode = fields[colFieldMap[codeColumnIndex]?.code || ""] || "";

    try {
      // 复用 normalizeFields 做校验
      const normalized = normalizeFields(mapping, fields);
      await businessDataRepo.create(mapping, normalized);
      results.success++;
    } catch (err) {
      const friendlyMsg = friendlyImportError(err, excelRow, codeFieldName, bizCode);
      results.errors.push({ row: excelRow, bizCode, message: friendlyMsg });
    }
  }

  return results;
}

function isCodeField(mapping, field) {
  if (mapping.storageMode === "json_table") return field.code === mapping.codeField;
  return field.column === mapping.bizCodeColumn;
}
