import { pool } from "../config/db.js";

const IDENTIFIER_RE = /^[A-Za-z0-9_]+$/;
const MAX_PAGE_SIZE = 200;

export function normalizePaging({ page, pageSize } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || 20));
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export async function search(mapping, query = {}) {
  const paging = normalizePaging(query);
  const where = buildWhere(mapping, query);
  const select = buildSelect(mapping);
  const table = quoteIdentifier(mapping.table);
  const orderSql = mapping.updatedAtColumn
    ? `${quoteIdentifier(mapping.updatedAtColumn)} DESC, ${quoteIdentifier(mapping.bizCodeColumn)} DESC`
    : `${quoteIdentifier(mapping.bizCodeColumn)} DESC`;

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
  const insert = buildWrite(mapping, fields);
  const table = quoteIdentifier(mapping.table);
  await pool.query(
    `INSERT INTO ${table} (${insert.columns.join(", ")})
     VALUES (${insert.placeholders.join(", ")})`,
    insert.values,
  );
  return getDetail(mapping, fields[bizFieldCode(mapping)]);
}

export async function update(mapping, bizCode, fields = {}) {
  const write = buildWrite(mapping, fields);
  const table = quoteIdentifier(mapping.table);
  await pool.query(
    `UPDATE ${table}
     SET ${write.columns.map((column) => `${column} = ?`).join(", ")}
     WHERE ${quoteIdentifier(mapping.bizCodeColumn)} = ?`,
    [...write.values, bizCode],
  );
  return getDetail(mapping, fields[bizFieldCode(mapping)]);
}

export async function remove(mapping, bizCode) {
  const table = quoteIdentifier(mapping.table);
  const [result] = await pool.query(
    `DELETE FROM ${table} WHERE ${quoteIdentifier(mapping.bizCodeColumn)} = ?`,
    [bizCode],
  );
  return result.affectedRows;
}

export async function listWarehouses(mappings) {
  const result = new Map();
  for (const mapping of mappings) {
    if (!mapping.warehouse) continue;
    const table = quoteIdentifier(mapping.table);
    const warehouse = sourceExpression(mapping, mapping.warehouse);
    const where = [];
    const params = [...warehouse.params];
    if (mapping.typeColumn) {
      where.push(`${quoteIdentifier(mapping.typeColumn)} = ?`);
      params.push(mapping.typeValue);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT DISTINCT ${warehouse.sql} AS warehouseCode
       FROM ${table}
       ${whereSql}
       HAVING warehouseCode IS NOT NULL AND warehouseCode <> ''
       ORDER BY warehouseCode ASC
       LIMIT 500`,
      params,
    );
    for (const row of rows) {
      const code = String(row.warehouseCode || "").trim();
      if (code && !result.has(code)) result.set(code, { warehouseCode: code, warehouseName: code });
    }
  }
  return [...result.values()];
}

function buildWrite(mapping, fields) {
  const columns = [];
  const placeholders = [];
  const values = [];
  for (const field of mapping.fields) {
    if (field.source !== "column") continue;
    columns.push(quoteIdentifier(field.column));
    placeholders.push("?");
    values.push(toStorageValue(field, fields[field.code]));
  }
  return { columns, placeholders, values };
}

function bizFieldCode(mapping) {
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
