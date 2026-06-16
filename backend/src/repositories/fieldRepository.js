import { pool } from "../config/db.js";

export async function listFields(templateType) {
  const [rows] = await pool.query(
    `SELECT template_type, field_code, field_name, field_type, example_value, is_required, description, sort_no
     FROM print_field_dict
     WHERE template_type = ? AND enabled = 1
     ORDER BY sort_no ASC, id ASC`,
    [String(templateType || "").toUpperCase()],
  );
  return rows;
}

export async function createField(templateType, field) {
  await pool.query(
    `INSERT INTO print_field_dict
       (template_type, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      String(templateType || "").toUpperCase(),
      field.code,
      field.name,
      field.type,
      field.example || null,
      field.required ? 1 : 0,
      field.desc || null,
      field.sortNo || 0,
    ],
  );
  return getField(templateType, field.code);
}

export async function getField(templateType, fieldCode) {
  const [rows] = await pool.query(
    `SELECT template_type, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled
     FROM print_field_dict
     WHERE template_type = ? AND field_code = ?
     LIMIT 1`,
    [String(templateType || "").toUpperCase(), fieldCode],
  );
  return rows[0] || null;
}

export async function updateField(templateType, fieldCode, field) {
  await pool.query(
    `UPDATE print_field_dict
     SET field_name = ?, field_type = ?, example_value = ?, is_required = ?, description = ?, sort_no = ?
     WHERE template_type = ? AND field_code = ?`,
    [
      field.name,
      field.type,
      field.example || null,
      field.required ? 1 : 0,
      field.desc || null,
      field.sortNo || 0,
      String(templateType || "").toUpperCase(),
      fieldCode,
    ],
  );
  return getField(templateType, fieldCode);
}

export async function countFieldReferences(templateType, fieldCode) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM print_template_element e
     INNER JOIN print_template t ON t.id = e.template_id
     WHERE t.template_type = ? AND e.bind_field = ?`,
    [String(templateType || "").toUpperCase(), fieldCode],
  );
  return Number(rows[0]?.total || 0);
}

export async function disableField(templateType, fieldCode) {
  const [result] = await pool.query(
    `UPDATE print_field_dict
     SET enabled = 0
     WHERE template_type = ? AND field_code = ?`,
    [String(templateType || "").toUpperCase(), fieldCode],
  );
  return result.affectedRows;
}
