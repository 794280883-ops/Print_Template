import { pool } from "../config/db.js";

export async function listEnabledModules() {
  const [rows] = await pool.query(
    `SELECT module_code, module_name, template_label, data_label, record_code_field, storage_mode, enabled, sort_no
     FROM print_business_module
     WHERE enabled = 1
     ORDER BY sort_no ASC, id ASC`,
  );
  return rows;
}

export async function getModule(moduleCode, db = pool) {
  const [rows] = await db.query(
    `SELECT module_code, module_name, template_label, data_label, record_code_field, storage_mode, enabled, sort_no
     FROM print_business_module
     WHERE module_code = ?
     LIMIT 1`,
    [String(moduleCode || "").toUpperCase()],
  );
  return rows[0] || null;
}

export async function createModule(module, db = pool) {
  await db.query(
    `INSERT INTO print_business_module
       (module_code, module_name, template_label, data_label, record_code_field, storage_mode, enabled, sort_no)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      module.code,
      module.name,
      module.templateLabel,
      module.dataLabel,
      module.recordCodeField,
      module.storageMode,
      module.sortNo,
    ],
  );
  return getModule(module.code, db);
}

export async function restoreModule(module, db = pool) {
  await db.query(
    `UPDATE print_business_module
     SET module_name = ?, template_label = ?, data_label = ?, record_code_field = ?,
         storage_mode = ?, enabled = 1, sort_no = ?
     WHERE module_code = ? AND enabled = 0`,
    [
      module.name,
      module.templateLabel,
      module.dataLabel,
      module.recordCodeField,
      module.storageMode,
      module.sortNo,
      module.code,
    ],
  );
  return getModule(module.code, db);
}

export async function disableModule(moduleCode) {
  const code = String(moduleCode || "").toUpperCase();
  const [result] = await pool.query(
    `UPDATE print_business_module
     SET enabled = 0
     WHERE module_code = ? AND enabled = 1`,
    [code],
  );
  return result.affectedRows;
}

export async function updateModule(moduleCode, module) {
  const code = String(moduleCode || "").toUpperCase();
  await pool.query(
    `UPDATE print_business_module
     SET module_name = ?, template_label = ?, data_label = ?
     WHERE module_code = ?`,
    [module.name, module.templateLabel, module.dataLabel, code],
  );
  return getModule(code);
}
