import * as recordRepository from "../repositories/recordRepository.js";
import { compileSchema, listModuleSchemas } from "./schemaService.js";
import { appError } from "../utils/response.js";
import XLSX from "xlsx";

/**
 * Run a uniqueness check + insert/update within a transaction using SELECT ... FOR UPDATE.
 * This prevents race conditions: two concurrent requests creating the same unique combination
 * will serialize — the second one sees the first's inserted row and rejects.
 */
async function withUniqueGuard(moduleCode, schema, recordData, recordCode, action) {
  const conn = await recordRepository.getConnection();
  try {
    await conn.beginTransaction();

    // Lock: if unique fields configured, lock the range to prevent concurrent duplicate insert
    if (schema.uniqueFields?.length) {
      const exists = await recordRepository.existsByUniqueFields(
        moduleCode, schema.uniqueFields, recordData, recordCode, conn,
      );
      if (exists) {
        const fieldNames = schema.uniqueFields.map((f) => f.name).join(" + ");
        const fieldValues = schema.uniqueFields.map((f) => recordData[f.code]).join(" / ");
        throw appError(`${fieldNames}组合「${fieldValues}」已存在`, 40001, 409);
      }
    }

    const result = await action(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function listTypes() {
  return listModuleSchemas();
}

export async function searchRecords(query = {}) {
  const moduleCode = String(query.bizType || query.type || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const sort = resolveRecordSortOptions(query, schema);
  const allowedSortFields = getAllowedSortFields(schema);

  const searchableFieldCodes = new Set(schema.searchableFields.map((f) => f.code));
  if (schema.recordCodeField) searchableFieldCodes.add(schema.recordCodeField.code);

  let rawFieldFilters = query.fieldFilters;
  if (typeof rawFieldFilters === "string") {
    try { rawFieldFilters = JSON.parse(rawFieldFilters); } catch { rawFieldFilters = {}; }
  }

  const fieldFilters = {};
  if (rawFieldFilters && typeof rawFieldFilters === "object") {
    for (const [code, value] of Object.entries(rawFieldFilters)) {
      const v = String(value || "").trim();
      if (v && searchableFieldCodes.has(code)) {
        fieldFilters[code] = v;
      }
    }
  }

  return recordRepository.search(moduleCode, {
    keyword: String(query.keyword || "").trim(),
    fieldFilters,
    page: query.page,
    pageSize: query.pageSize,
    sortField: sort.sortField,
    sortDir: sort.sortDir,
    allowedSortFields,
  });
}

export function resolveRecordSortOptions(query = {}, schema = {}) {
  const defaultField = schema.recordCodeField?.code || "";
  const allowedFields = new Set(getAllowedSortFields(schema));
  const requestedField = String(query.sortField || defaultField).trim();
  const requestedDir = String(query.sortDir || "ASC").toUpperCase();
  const sortDir = requestedDir === "DESC" ? "DESC" : "ASC";

  if (!isSafeSortField(requestedField) || !allowedFields.has(requestedField)) {
    return { sortField: defaultField, sortDir: "ASC" };
  }

  return { sortField: requestedField, sortDir };
}

function isSafeSortField(field) {
  return /^[A-Za-z0-9_]+$/.test(field);
}

function getAllowedSortFields(schema = {}) {
  return [
    schema.recordCodeField?.code,
    ...(schema.sortableFields || []).map((field) => field.code),
    ...(schema.systemFields || []).filter((field) => field.sortable).map((field) => field.code),
  ].filter(Boolean);
}

export function getBusinessInputFields(schema = {}) {
  return (schema.fields || []).filter((field) => !field.system);
}

export async function createRecord(payload = {}) {
  const moduleCode = String(payload.bizType || payload.type || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const fields = payload.fields || {};

  const recordCode = String(fields[schema.recordCodeField.code] || "").trim();
  if (!recordCode) throw appError(`${schema.recordCodeField.name}必填`, 40000, 400);

  const recordData = {};
  for (const f of getBusinessInputFields(schema)) {
    recordData[f.code] = String(fields[f.code] ?? "").trim();
  }

  const searchText = schema.searchableFields
    .map((f) => recordData[f.code])
    .filter(Boolean)
    .join(" ");

  return withUniqueGuard(moduleCode, schema, recordData, null, (conn) =>
    recordRepository.create({ moduleCode, recordCode, recordData, searchText }, conn),
  );
}

export async function updateRecord(bizType, bizCode, payload = {}) {
  const moduleCode = String(bizType || "").toUpperCase();
  const schema = await compileSchema(moduleCode);
  const recordCode = String(bizCode || "").trim();
  const dbId = Number(payload._dbId) || 0;
  if (!recordCode) throw appError("缺少业务编码", 40000, 400);

  const fields = payload.fields || {};
  const newRecordCode = String(fields[schema.recordCodeField.code] || "").trim();
  if (!newRecordCode) throw appError(`${schema.recordCodeField.name}必填`, 40000, 400);

  const recordData = {};
  for (const f of getBusinessInputFields(schema)) {
    recordData[f.code] = f.code === schema.recordCodeField.code
      ? newRecordCode
      : String(fields[f.code] ?? "").trim();
  }

  const searchText = schema.searchableFields
    .map((f) => recordData[f.code])
    .filter(Boolean)
    .join(" ");

  return withUniqueGuard(moduleCode, schema, recordData, recordCode, async (conn) => {
    // Use DB primary key for precise row targeting when available
    if (dbId) {
      const exists = await recordRepository.getById(dbId, conn);
      if (!exists) throw appError("业务数据不存在", 40400, 404);
      return recordRepository.updateById(dbId, { recordCode: newRecordCode, recordData, searchText }, conn);
    }
    // Fallback: locate by module_code + record_code (legacy)
    const exists = await recordRepository.getByCode(moduleCode, recordCode, conn);
    if (!exists) throw appError("业务数据不存在", 40400, 404);
    const options = { recordData, searchText };
    if (newRecordCode !== recordCode) {
      options.newRecordCode = newRecordCode;
    }
    return recordRepository.update(moduleCode, recordCode, options, conn);
  });
}

export async function deleteRecord(bizType, bizCode, payload = {}) {
  const moduleCode = String(bizType || "").toUpperCase();
  const recordCode = String(bizCode || "").trim();
  const dbId = Number(payload._dbId) || 0;
  if (!dbId && !recordCode) throw appError("缺少业务编码", 40000, 400);

  let affectedRows;
  if (dbId) {
    affectedRows = await recordRepository.removeById(dbId);
  } else {
    affectedRows = await recordRepository.remove(moduleCode, recordCode);
  }
  if (!affectedRows) throw appError("业务数据不存在", 40400, 404);
  return { deleted: true };
}

export async function deleteRecords(_bizType, payload = {}, repository = recordRepository) {
  const ids = Array.isArray(payload.ids) ? payload.ids.map(Number).filter(id => id > 0) : [];
  if (!ids.length) throw appError("请选择要删除的业务数据", 40000, 400);
  const affectedRows = await repository.removeByIds(ids);
  if (!affectedRows) throw appError("业务数据不存在", 40400, 404);
  return { deleted: affectedRows };
}

export async function generateImportTemplate(bizType) {
  const schema = await compileSchema(bizType);
  const headers = getBusinessInputFields(schema).map((f) => f.name);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, schema.module.label);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function exportRecords(bizType) {
  const schema = await compileSchema(bizType);
  const inputFields = getBusinessInputFields(schema);
  const headers = inputFields.map((f) => f.name);

  const result = await recordRepository.search(bizType, {
    keyword: "",
    fieldFilters: {},
    page: 1,
    pageSize: 10000,
    sortField: schema.recordCodeField?.code || "",
    sortDir: "ASC",
    allowedSortFields: [schema.recordCodeField?.code].filter(Boolean),
  });

  const dataRows = (result.rows || []).map((row) =>
    inputFields.map((f) => {
      const v = row.fields?.[f.code];
      return v !== undefined && v !== null ? String(v) : "";
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
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
  const inputFields = getBusinessInputFields(schema);
  const colFieldMap = headerRow.map((h) => inputFields.find((f) => f.name === h) || null);

  const codeColIdx = colFieldMap.findIndex((f) => f && f.code === schema.recordCodeField.code);
  if (codeColIdx < 0) throw appError(`Excel 表头中未找到"${schema.recordCodeField.name}"列`, 40000, 400);

  const results = { total: Math.max(0, rows.length - 1), success: 0, errors: [] };
  const candidates = [];
  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
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
    candidates.push({ row: rowIdx + 1, fields, recordCode: String(fields[schema.recordCodeField.code] || "").trim() });
  }

  for (const candidate of candidates) {
    try {
      await createRecord({ bizType, fields: candidate.fields });
      results.success++;
    } catch (err) {
      results.errors.push({ row: candidate.row, message: err.message || "未知错误" });
    }
  }
  return results;
}
