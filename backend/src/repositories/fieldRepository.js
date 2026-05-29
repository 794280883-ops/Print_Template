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
