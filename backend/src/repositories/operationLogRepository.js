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
