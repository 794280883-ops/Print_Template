import { pool } from "../config/db.js";

/** Get a dedicated connection from the pool (for transactions). */
export function getConnection() {
  return pool.getConnection();
}

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
      where += " AND (record_code LIKE ? OR search_text LIKE ?)";
      params.push(`%${codes[0]}%`, `%${codes[0]}%`);
    } else if (codes.length > 1) {
      const clauses = codes.map(() => "(record_code LIKE ? OR search_text LIKE ?)");
      where += ` AND (${clauses.join(" OR ")})`;
      for (const c of codes) {
        params.push(`%${c}%`, `%${c}%`);
      }
    }
  }

  for (const [fieldCode, value] of Object.entries(fieldFilters)) {
    if (!/^[A-Za-z0-9_]+$/.test(fieldCode)) continue;
    const codes = String(value || "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (codes.length === 0) continue;
    if (codes.length === 1) {
      where += ` AND JSON_UNQUOTE(JSON_EXTRACT(record_data, '$."${fieldCode}"')) = ?`;
      params.push(codes[0]);
    } else {
      const placeholders = codes.map(() => "?").join(", ");
      where += ` AND JSON_UNQUOTE(JSON_EXTRACT(record_data, '$."${fieldCode}"')) IN (${placeholders})`;
      params.push(...codes);
    }
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM business_record ${where}`,
    params,
  );

  let orderClause = "ORDER BY updated_at DESC";
  if (isAllowedSortField(sortField, allowedSortFields) && sortDir) {
    const dir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
    orderClause = sortField === "printCount"
      ? `ORDER BY print_count ${dir}`
      : `ORDER BY JSON_UNQUOTE(JSON_EXTRACT(record_data, '$."${sortField}"')) ${dir}`;
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

export async function getByCode(moduleCode, recordCode, conn = pool) {
  const [rows] = await conn.query(
    "SELECT * FROM business_record WHERE module_code = ? AND record_code = ? LIMIT 1",
    [moduleCode, recordCode],
  );
  return rows[0] ? toDto(rows[0]) : null;
}

export async function getById(dbId, conn = pool) {
  const [rows] = await conn.query(
    "SELECT * FROM business_record WHERE id = ? LIMIT 1",
    [dbId],
  );
  return rows[0] ? toDto(rows[0]) : null;
}

export async function updateById(dbId, { recordCode, recordData, searchText }, conn = pool) {
  await conn.query(
    `UPDATE business_record
     SET record_code = ?, record_data = ?, search_text = ?
     WHERE id = ?`,
    [recordCode, JSON.stringify(recordData), searchText, dbId],
  );
  return getById(dbId, conn);
}

export async function existsByUniqueFields(moduleCode, uniqueFields, recordData, excludeRecordCode = null, conn = pool) {
  if (!uniqueFields || !uniqueFields.length) return false;
  let where = "WHERE module_code = ?";
  const params = [moduleCode];
  for (const field of uniqueFields) {
    where += ` AND JSON_UNQUOTE(JSON_EXTRACT(record_data, '$."${field.code}"')) = ?`;
    params.push(String(recordData[field.code] ?? ""));
  }
  if (excludeRecordCode) {
    where += " AND record_code <> ?";
    params.push(excludeRecordCode);
  }
  // FOR UPDATE locks matching rows (or gap) to prevent concurrent duplicate inserts
  const [[{ total }]] = await conn.query(
    `SELECT COUNT(*) AS total FROM business_record ${where} FOR UPDATE`,
    params,
  );
  return total > 0;
}

export async function create({ moduleCode, recordCode, recordData, searchText }, conn = pool) {
  await conn.query(
    `INSERT INTO business_record (module_code, record_code, record_data, search_text)
     VALUES (?, ?, ?, ?)`,
    [moduleCode, recordCode, JSON.stringify(recordData), searchText],
  );
  return getByCode(moduleCode, recordCode, conn);
}

export async function update(moduleCode, recordCode, { recordData, searchText, newRecordCode }, conn = pool) {
  const targetCode = newRecordCode || recordCode;
  if (newRecordCode && newRecordCode !== recordCode) {
    await conn.query(
      `UPDATE business_record
       SET record_code = ?, record_data = ?, search_text = ?
       WHERE module_code = ? AND record_code = ?`,
      [newRecordCode, JSON.stringify(recordData), searchText, moduleCode, recordCode],
    );
  } else {
    await conn.query(
      `UPDATE business_record
       SET record_data = ?, search_text = ?
       WHERE module_code = ? AND record_code = ?`,
      [JSON.stringify(recordData), searchText, moduleCode, recordCode],
    );
  }
  return getByCode(moduleCode, targetCode, conn);
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

/**
 * Delete records by their database primary key IDs.
 * More precise than code-based deletion — each ID maps to exactly one row.
 */
export async function removeByIds(ids = []) {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => "?").join(", ");
  const [result] = await pool.query(
    `DELETE FROM business_record WHERE id IN (${placeholders})`,
    ids,
  );
  return result.affectedRows;
}

export async function removeById(dbId) {
  const [result] = await pool.query(
    "DELETE FROM business_record WHERE id = ?",
    [dbId],
  );
  return result.affectedRows;
}

export async function incrementPrintCountByIds(ids = []) {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => "?").join(", ");
  const [result] = await pool.query(
    `UPDATE business_record
     SET print_count = print_count + 1
     WHERE id IN (${placeholders})`,
    ids,
  );
  return result.affectedRows;
}

function toDto(row) {
  const fields = typeof row.record_data === "string" ? JSON.parse(row.record_data) : row.record_data;
  const printCount = Number(row.print_count || 0);
  return {
    _dbId: row.id,
    id: `${row.module_code}:${row.record_code}`,
    businessType: row.module_code,
    businessCode: row.record_code,
    printCount,
    fields: { ...fields, printCount },
    updatedAt: row.updated_at || "",
  };
}
