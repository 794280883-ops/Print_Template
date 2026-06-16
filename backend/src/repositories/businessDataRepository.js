import { pool } from "../config/db.js";

const IDENTIFIER_RE = /^[A-Za-z0-9_]+$/;
const MAX_PAGE_SIZE = 200;

function normalizePaging({ page, pageSize } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || 20));
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export async function search(mapping, query = {}) {
  const paging = normalizePaging(query);
  const where = buildWhere(mapping, query);
  const select = buildSelect(mapping);
  const table = quoteIdentifier(mapping.table);
  const orderSql = buildOrder(mapping, query);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM ${table} ${where.sql}`,
    where.params,
  );

  const [rows] = await pool.query(
    `SELECT ${select.sql}
     FROM ${table}
     ${where.sql}
     ORDER BY ${orderSql}
     LIMIT ? OFFSET ?`,
    [...select.params, ...where.params, paging.pageSize, paging.offset],
  );

  return { rows: rows.map((row) => toDto(mapping, row)), total, page: paging.page, pageSize: paging.pageSize };
}

export async function getDetail(mapping, bizCode) {
  const select = buildSelect(mapping);
  const table = quoteIdentifier(mapping.table);
  const where = [`${quoteIdentifier(mapping.bizCodeColumn)} = ?`];
  const params = [bizCode];
  if (mapping.typeColumn) {
    where.unshift(`${quoteIdentifier(mapping.typeColumn)} = ?`);
    params.unshift(mapping.typeValue);
  }

  const [rows] = await pool.query(
    `SELECT ${select.sql}
     FROM ${table}
     WHERE ${where.join(" AND ")}
     LIMIT 1`,
    [...select.params, ...params],
  );
  return rows[0] ? toDto(mapping, rows[0]) : null;
}

export async function create(mapping, fields = {}) {
  if (mapping.storageMode === "json_table") return createJson(mapping, fields);
  const insert = buildWrite(mapping, fields);
  const table = quoteIdentifier(mapping.table);
  let columns = insert.columns.join(", ");
  let placeholders = insert.placeholders.join(", ");
  if (insert.jsonSetClause) {
    const jsonCol = quoteIdentifier(mapping.fieldsJsonColumn);
    columns += `, ${jsonCol}`;
    placeholders += ", ?";
  }
  await pool.query(
    `INSERT INTO ${table} (${columns})
     VALUES (${placeholders})`,
    insert.values,
  );
  return getDetail(mapping, fields[bizFieldCode(mapping)]);
}

export async function update(mapping, bizCode, fields = {}) {
  if (mapping.storageMode === "json_table") return updateJson(mapping, bizCode, fields);
  const write = buildWrite(mapping, fields);
  const table = quoteIdentifier(mapping.table);
  let setClauses = write.columns.map((column) => `${column} = ?`);
  if (write.jsonSetClause) {
    setClauses.push(write.jsonSetClause);
  }
  await pool.query(
    `UPDATE ${table}
     SET ${setClauses.join(", ")}
     WHERE ${quoteIdentifier(mapping.bizCodeColumn)} = ?`,
    [...write.values, bizCode],
  );
  return getDetail(mapping, fields[bizFieldCode(mapping)]);
}

export async function remove(mapping, bizCode) {
  if (mapping.storageMode === "json_table") return removeJson(mapping, bizCode);
  const table = quoteIdentifier(mapping.table);
  const [result] = await pool.query(
    `DELETE FROM ${table} WHERE ${quoteIdentifier(mapping.bizCodeColumn)} = ?`,
    [bizCode],
  );
  return result.affectedRows;
}

async function createJson(mapping, fields = {}) {
  const bizCode = fields[mapping.codeField];
  await pool.query(
    `INSERT INTO business_data (business_type, business_code, business_data)
     VALUES (?, ?, ?)`,
    [mapping.code, bizCode, JSON.stringify(fields)],
  );
  return getDetail(mapping, bizCode);
}

async function updateJson(mapping, bizCode, fields = {}) {
  const nextBizCode = fields[mapping.codeField];
  await pool.query(
    `UPDATE business_data
     SET business_code = ?, business_data = ?
     WHERE business_type = ? AND business_code = ?`,
    [nextBizCode, JSON.stringify(fields), mapping.code, bizCode],
  );
  return getDetail(mapping, nextBizCode);
}

async function removeJson(mapping, bizCode) {
  const [result] = await pool.query(
    `DELETE FROM business_data
     WHERE business_type = ? AND business_code = ?`,
    [mapping.code, bizCode],
  );
  return result.affectedRows;
}

function buildWrite(mapping, fields) {
  const columns = [];
  const placeholders = [];
  const values = [];
  let jsonSetClause = "";

  for (const field of mapping.fields) {
    if (field.source === "column") {
      columns.push(quoteIdentifier(field.column));
      placeholders.push("?");
      values.push(toStorageValue(field, fields[field.code]));
    }
  }

  // Collect JSON fields for dynamic storage
  const jsonCol = mapping.fieldsJsonColumn;
  if (jsonCol) {
    const jsonData = {};
    for (const field of mapping.fields) {
      if (field.source !== "json") continue;
      const key = (field.path || "").replace(/^\$\./, "") || field.code;
      const val = toStorageValue(field, fields[field.code]);
      if (val !== null && val !== undefined && val !== "") {
        jsonData[key] = val;
      }
    }
    if (Object.keys(jsonData).length > 0) {
      const col = quoteIdentifier(jsonCol);
      jsonSetClause = `${col} = JSON_MERGE_PATCH(COALESCE(${col}, '{}'), ?)`;
      values.push(JSON.stringify(jsonData));
    }
  }

  return { columns, placeholders, values, jsonSetClause };
}

function bizFieldCode(mapping) {
  if (mapping.storageMode === "json_table") return mapping.codeField;
  const field = mapping.fields.find((item) => item.source === "column" && item.column === mapping.bizCodeColumn);
  return field?.code || "";
}

function buildSelect(mapping) {
  const parts = [`${quoteIdentifier(mapping.bizCodeColumn)} AS businessCode`];
  const params = [];
  if (mapping.updatedAtColumn) parts.push(`${quoteIdentifier(mapping.updatedAtColumn)} AS updatedAt`);
  for (const field of mapping.fields) {
    const expr = sourceExpression(mapping, field);
    parts.push(`${expr.sql} AS ${quoteIdentifier(field.code)}`);
    params.push(...expr.params);
  }
  return { sql: parts.join(", "), params };
}

function buildOrder(mapping, query) {
  const defaultOrder = mapping.updatedAtColumn
    ? `${quoteIdentifier(mapping.updatedAtColumn)} DESC, ${quoteIdentifier(mapping.bizCodeColumn)} DESC`
    : `${quoteIdentifier(mapping.bizCodeColumn)} DESC`;

  if (!query.sortField || !query.sortDir) return defaultOrder;

  const dir = query.sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
  if (query.sortField === "businessCode") {
    return `${quoteIdentifier(mapping.bizCodeColumn)} ${dir}`;
  }
  if (query.sortField === "updatedAt") {
    return `${quoteIdentifier(mapping.updatedAtColumn)} ${dir}`;
  }
  // Support sorting by field codes (e.g., locationCode, containerCode, productCode)
  const field = mapping.fields.find((f) => f.code === query.sortField);
  if (field) {
    if (field.source === "json") {
      return `${jsonSourceSql(mapping, field)} ${dir}`;
    }
    const expr = sourceExpression(mapping, field);
    return `${expr.sql} ${dir}`;
  }
  return defaultOrder;
}

function buildWhere(mapping, query) {
  const where = [];
  const params = [];
  if (mapping.typeColumn) {
    where.push(`${quoteIdentifier(mapping.typeColumn)} = ?`);
    params.push(mapping.typeValue);
  }
  if (query.keyword) {
    const keywordParts = [];
    for (const source of mapping.keyword || []) {
      const expr = sourceExpression(mapping, source);
      keywordParts.push(`${expr.sql} LIKE ?`);
      params.push(...expr.params, `%${query.keyword}%`);
    }
    if (keywordParts.length) where.push(`(${keywordParts.join(" OR ")})`);
  }
  if (query.warehouseCode && mapping.warehouse) {
    const expr = sourceExpression(mapping, mapping.warehouse);
    where.push(`${expr.sql} = ?`);
    params.push(...expr.params, query.warehouseCode);
  }
  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

function sourceExpression(mapping, source) {
  if (source.source === "column") return { sql: quoteIdentifier(source.column), params: [] };
  if (source.source === "json") {
    return {
      sql: `JSON_UNQUOTE(JSON_EXTRACT(${quoteIdentifier(mapping.fieldsJsonColumn)}, ?))`,
      params: [source.path],
    };
  }
  throw new Error(`Unsupported business data source: ${source.source}`);
}

function jsonSourceSql(mapping, source) {
  const path = String(source.path || "");
  if (!/^\$\.[A-Za-z0-9_]+$/.test(path)) throw new Error(`Unsafe JSON path: ${path}`);
  return `JSON_UNQUOTE(JSON_EXTRACT(${quoteIdentifier(mapping.fieldsJsonColumn)}, '${path}'))`;
}

function toDto(mapping, row) {
  const fields = {};
  for (const field of mapping.fields) fields[field.code] = transformFieldValue(field, row[field.code]);
  return {
    id: `${mapping.code}:${row.businessCode}`,
    businessType: mapping.code,
    businessCode: row.businessCode,
    fields,
    updatedAt: row.updatedAt || "",
  };
}

function toStorageValue(field, value) {
  if (value === null || value === undefined || value === "") return null;
  if (field.transform === "locationDirectionMark") {
    const directionMap = {
      "1": "1",
      "2": "2",
      "向上": "1",
      "向下": "2",
      "↑": "1",
      "↓": "2",
    };
    return directionMap[String(value).trim()] || null;
  }
  return value;
}

function transformFieldValue(field, value) {
  if (value === null || value === undefined || value === "") return "";
  if (field.transform === "locationDirectionMark") {
    const directionMap = {
      1: "向上",
      2: "向下",
    };
    return directionMap[String(value).trim()] || "";
  }
  return value;
}

function quoteIdentifier(value) {
  const text = String(value || "");
  if (!IDENTIFIER_RE.test(text)) throw new Error(`Unsafe identifier: ${text}`);
  return `\`${text}\``;
}
