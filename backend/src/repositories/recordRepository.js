import { pool } from "../config/db.js";

export async function search(moduleCode, { keyword, fieldFilters = {}, page = 1, pageSize = 20, sortField, sortDir, allowedSortFields = [] } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(200, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safeSize;

  let where = "WHERE module_code = ?";
  const params = [moduleCode];

  if (keyword) {
    const codes = String(keyword)
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (codes.length === 1) {
      where += " AND record_code LIKE ?";
      params.push(`%${codes[0]}%`);
    } else if (codes.length > 1) {
      const placeholders = codes.map(() => "?").join(", ");
      where += ` AND record_code IN (${placeholders})`;
      params.push(...codes);
    }
  }

  for (const [fieldCode, value] of Object.entries(fieldFilters)) {
    if (!/^[A-Za-z0-9_]+$/.test(fieldCode)) continue;
    where += ` AND JSON_UNQUOTE(JSON_EXTRACT(record_data, '$."${fieldCode}"')) = ?`;
    params.push(value);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM business_record ${where}`,
    params,
  );

  let orderClause = "ORDER BY updated_at DESC";
  if (isAllowedSortField(sortField, allowedSortFields) && sortDir) {
    const dir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
    orderClause = `ORDER BY JSON_UNQUOTE(JSON_EXTRACT(record_data, '$."${sortField}"')) ${dir}`;
  }

  const [rows] = await pool.query(
    `SELECT * FROM business_record ${where} ${orderClause} LIMIT ? OFFSET ?`,
    [...params, safeSize, offset],
  );

  return {
    rows: rows.map(toDto),
    total,
    page: safePage,
    pageSize: safeSize,
  };
}

function isAllowedSortField(sortField, allowedSortFields) {
  return typeof sortField === "string" &&
    /^[A-Za-z0-9_]+$/.test(sortField) &&
    allowedSortFields.includes(sortField);
}

export async function getByCode(moduleCode, recordCode) {
  const [rows] = await pool.query(
    "SELECT * FROM business_record WHERE module_code = ? AND record_code = ? LIMIT 1",
    [moduleCode, recordCode],
  );
  return rows[0] ? toDto(rows[0]) : null;
}

export async function create({ moduleCode, recordCode, recordData, searchText }) {
  await pool.query(
    `INSERT INTO business_record (module_code, record_code, record_data, search_text)
     VALUES (?, ?, ?, ?)`,
    [moduleCode, recordCode, JSON.stringify(recordData), searchText],
  );
  return getByCode(moduleCode, recordCode);
}

export async function update(moduleCode, recordCode, { recordData, searchText }) {
  await pool.query(
    `UPDATE business_record
     SET record_data = ?, search_text = ?
     WHERE module_code = ? AND record_code = ?`,
    [JSON.stringify(recordData), searchText, moduleCode, recordCode],
  );
  return getByCode(moduleCode, recordCode);
}

export async function remove(moduleCode, recordCode) {
  const [result] = await pool.query(
    "DELETE FROM business_record WHERE module_code = ? AND record_code = ?",
    [moduleCode, recordCode],
  );
  return result.affectedRows;
}

export async function removeMany(moduleCode, recordCodes = []) {
  if (!recordCodes.length) return 0;
  const placeholders = recordCodes.map(() => "?").join(", ");
  const [result] = await pool.query(
    `DELETE FROM business_record WHERE module_code = ? AND record_code IN (${placeholders})`,
    [moduleCode, ...recordCodes],
  );
  return result.affectedRows;
}

function toDto(row) {
  return {
    id: `${row.module_code}:${row.record_code}`,
    businessType: row.module_code,
    businessCode: row.record_code,
    fields: typeof row.record_data === "string" ? JSON.parse(row.record_data) : row.record_data,
    updatedAt: row.updated_at || "",
  };
}
