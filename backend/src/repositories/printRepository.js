import { pool } from "../config/db.js";

export async function createPrintLog(payload) {
  const [result] = await pool.query(
    `INSERT INTO print_log
      (template_id, template_code, business_type, business_no, warehouse_code, print_payload, print_status, error_message, operator)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Admin')`,
    [
      payload.templateId || null,
      payload.templateCode || null,
      payload.businessType || null,
      payload.businessNo || null,
      payload.warehouseCode || null,
      JSON.stringify(payload.printPayload || payload),
      payload.printStatus || "success",
      payload.errorMessage || null,
    ],
  );
  return getPrintLog(result.insertId);
}

async function getPrintLog(id) {
  const [[row]] = await pool.query("SELECT * FROM print_log WHERE id = ?", [id]);
  return row || null;
}
