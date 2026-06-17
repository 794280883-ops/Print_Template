import * as recordRepository from "../repositories/recordRepository.js";
import { compileSchema, listModuleSchemas } from "./schemaService.js";
import { appError } from "../utils/response.js";
import XLSX from "xlsx";

export async function listTypes() {
  return listModuleSchemas();
}

export async function searchRecords(query = {}) {
  const moduleCode = String(query.bizType || query.type || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  return recordRepository.search(moduleCode, {
    keyword: String(query.keyword || "").trim(),
    page: query.page,
    pageSize: query.pageSize,
    sortField: query.sortField || schema.recordCodeField.code,
    sortDir: query.sortDir || "ASC",
  });
}

export async function createRecord(payload = {}) {
  const moduleCode = String(payload.bizType || payload.type || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const fields = payload.fields || {};

  const recordCode = String(fields[schema.recordCodeField.code] || "").trim();
  if (!recordCode) throw appError(`${schema.recordCodeField.name}必填`, 40000, 400);

  const recordData = {};
  for (const f of schema.fields) {
    recordData[f.code] = String(fields[f.code] ?? "").trim();
  }

  const searchText = schema.searchableFields
    .map((f) => recordData[f.code])
    .filter(Boolean)
    .join(" ");

  try {
    return await recordRepository.create({ moduleCode, recordCode, recordData, searchText });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") throw appError("业务编码已存在", 40001, 409);
    throw error;
  }
}

export async function updateRecord(bizType, bizCode, payload = {}) {
  const moduleCode = String(bizType || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const recordCode = String(bizCode || "").trim();
  if (!recordCode) throw appError("缺少业务编码", 40000, 400);

  const exists = await recordRepository.getByCode(moduleCode, recordCode);
  if (!exists) throw appError("业务数据不存在", 40400, 404);

  const fields = payload.fields || {};
  const recordData = {};
  for (const f of schema.fields) {
    recordData[f.code] = String(fields[f.code] ?? "").trim();
  }

  const searchText = schema.searchableFields
    .map((f) => recordData[f.code])
    .filter(Boolean)
    .join(" ");

  return recordRepository.update(moduleCode, recordCode, { recordData, searchText });
}

export async function deleteRecord(bizType, bizCode) {
  const moduleCode = String(bizType || "").toUpperCase();
  const recordCode = String(bizCode || "").trim();
  if (!recordCode) throw appError("缺少业务编码", 40000, 400);
  const affectedRows = await recordRepository.remove(moduleCode, recordCode);
  if (!affectedRows) throw appError("业务数据不存在", 40400, 404);
  return { deleted: true };
}

export async function generateImportTemplate(bizType) {
  const schema = await compileSchema(bizType);
  const headers = schema.fields.map((f) => f.name);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, schema.module.label);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function importRecords(bizType, fileBuffer) {
  const schema = await compileSchema(bizType);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw appError("Excel 文件中没有工作表", 40000, 400);

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  if (rows.length < 2) throw appError("Excel 文件中没有数据行", 40000, 400);

  const headerRow = rows[0].map((h) => String(h || "").trim());
  const colFieldMap = headerRow.map((h) => schema.fields.find((f) => f.name === h) || null);

  const codeColIdx = colFieldMap.findIndex((f) => f && f.code === schema.recordCodeField.code);
  if (codeColIdx < 0) throw appError(`Excel 表头中未找到"${schema.recordCodeField.name}"列`, 40000, 400);

  const results = { total: 0, success: 0, errors: [] };
  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    results.total++;
    const fields = {};
    let hasValue = false;
    for (let ci = 0; ci < colFieldMap.length; ci++) {
      const f = colFieldMap[ci];
      if (!f) continue;
      const value = String(row[ci] ?? "").trim();
      fields[f.code] = value;
      if (value) hasValue = true;
    }
    if (!hasValue) continue;
    try {
      await createRecord({ bizType, fields });
      results.success++;
    } catch (err) {
      results.errors.push({ row: rowIdx + 1, message: err.message || "未知错误" });
    }
  }
  return results;
}
