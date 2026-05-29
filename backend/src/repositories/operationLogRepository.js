import { pool } from "../config/db.js";

export async function addOperationLog({ actionName, targetType = "print_template", targetId = null, targetName = "", beforeJson = null, afterJson = null }) {
  await pool.query(
    `INSERT INTO operation_log
      (module_name, action_name, target_type, target_id, target_name, before_json, after_json, operator)
     VALUES ('print_template', ?, ?, ?, ?, ?, ?, 'Admin')`,
    [
      actionName,
      targetType,
      targetId,
      targetName,
      JSON.stringify(beforeJson),
      JSON.stringify(afterJson),
    ],
  );
}

export async function listOperationLogs(limit = 200) {
  const [rows] = await pool.query(
    `SELECT id, module_name, action_name, target_type, target_id, target_name, operator, operated_at
     FROM operation_log
     ORDER BY operated_at DESC, id DESC
     LIMIT ?`,
    [Number(limit) || 200],
  );
  return rows;
}
