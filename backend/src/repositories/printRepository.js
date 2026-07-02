import { pool } from "../config/db.js";

export async function createPrintLog(payload) {
  const [result] = await pool.query(
    `INSERT INTO print_log
      (template_id, template_code, business_type, business_no, warehouse_code, print_payload, print_status, error_message, operator)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.templateId || null,
      payload.templateCode || null,
      payload.businessType || null,
      payload.businessNo || null,
      payload.warehouseCode || null,
      JSON.stringify(payload.printPayload || payload),
      payload.printStatus || "success",
      payload.errorMessage || null,
      payload.operator || "Admin",
    ],
  );
  return getPrintLog(result.insertId);
}

export async function getLastPrintTemplate(operator, businessType) {
  const [rows] = await pool.query(
    `SELECT template_id FROM print_log
     WHERE operator = ? AND business_type = ? AND template_id IS NOT NULL
     ORDER BY printed_at DESC
     LIMIT 1`,
    [operator, businessType],
  );
  return rows[0]?.template_id || null;
}

async function getPrintLog(id) {
  const [[row]] = await pool.query("SELECT * FROM print_log WHERE id = ?", [id]);
  return row || null;
}
