import { pool } from "../config/db.js";

export async function listFields(moduleCode) {
  const [rows] = await pool.query(
    `SELECT module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled, searchable, sortable
     FROM print_field_dict
     WHERE module_code = ?
     ORDER BY enabled DESC, sort_no ASC, id ASC`,
    [String(moduleCode || "").toUpperCase()],
  );
  return rows;
}

export async function createField(moduleCode, field) {
  await pool.query(
    `INSERT INTO print_field_dict
       (module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled, searchable, sortable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      String(moduleCode || "").toUpperCase(),
      field.code,
      field.name,
      field.type,
      field.example || null,
      field.required ? 1 : 0,
      field.desc || null,
      field.sortNo || 0,
      field.searchable ? 1 : 0,
      field.sortable ? 1 : 0,
    ],
  );
  return getField(moduleCode, field.code);
}

export async function upsertField(moduleCode, field, db = pool) {
  const code = String(moduleCode || "").toUpperCase();
  await db.query(
    `INSERT INTO print_field_dict
       (module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled, searchable, sortable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON DUPLICATE KEY UPDATE
       field_name = VALUES(field_name), field_type = VALUES(field_type), example_value = VALUES(example_value),
       is_required = VALUES(is_required), description = VALUES(description), sort_no = VALUES(sort_no),
       enabled = 1, searchable = VALUES(searchable), sortable = VALUES(sortable)`,
    [
      code,
      field.code,
      field.name,
      field.type,
      field.example || null,
      field.required ? 1 : 0,
      field.desc || null,
      field.sortNo || 0,
      field.searchable ? 1 : 0,
      field.sortable ? 1 : 0,
    ],
  );
  return getField(code, field.code, db);
}

export async function getField(moduleCode, fieldCode, db = pool) {
  const [rows] = await db.query(
    `SELECT module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled, searchable, sortable
     FROM print_field_dict
     WHERE module_code = ? AND field_code = ?
     LIMIT 1`,
    [String(moduleCode || "").toUpperCase(), fieldCode],
  );
  return rows[0] || null;
}

export async function updateField(moduleCode, fieldCode, field) {
  await pool.query(
    `UPDATE print_field_dict
     SET field_name = ?, field_type = ?, example_value = ?, is_required = ?, description = ?, sort_no = ?,
         searchable = ?, sortable = ?
     WHERE module_code = ? AND field_code = ?`,
    [
      field.name,
      field.type,
      field.example || null,
      field.required ? 1 : 0,
      field.desc || null,
      field.sortNo || 0,
      field.searchable ? 1 : 0,
      field.sortable ? 1 : 0,
      String(moduleCode || "").toUpperCase(),
      fieldCode,
    ],
  );
  return getField(moduleCode, fieldCode);
}

export async function countFieldReferences(moduleCode, fieldCode) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM print_template_element e
     INNER JOIN print_template t ON t.id = e.template_id
     WHERE t.template_type = ? AND e.bind_field = ?`,
    [String(moduleCode || "").toUpperCase(), fieldCode],
  );
  return Number(rows[0]?.total || 0);
}

export async function disableField(moduleCode, fieldCode) {
  const [result] = await pool.query(
    `UPDATE print_field_dict
     SET enabled = 0
     WHERE module_code = ? AND field_code = ?`,
    [String(moduleCode || "").toUpperCase(), fieldCode],
  );
  return result.affectedRows;
}

export async function enableField(moduleCode, fieldCode) {
  const [result] = await pool.query(
    `UPDATE print_field_dict
     SET enabled = 1
     WHERE module_code = ? AND field_code = ?`,
    [String(moduleCode || "").toUpperCase(), fieldCode],
  );
  return result.affectedRows;
}

export async function deleteField(moduleCode, fieldCode) {
  const [result] = await pool.query(
    `DELETE FROM print_field_dict
     WHERE module_code = ? AND field_code = ?`,
    [String(moduleCode || "").toUpperCase(), fieldCode],
  );
  return result.affectedRows;
}
