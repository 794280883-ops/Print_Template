import { pool } from "../config/db.js";

export async function listRoles() {
  const [rows] = await pool.query("SELECT * FROM sys_role ORDER BY id ASC");
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM sys_role WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function createRole({ code, name }) {
  const [result] = await pool.query("INSERT INTO sys_role (code, name) VALUES (?, ?)", [code, name]);
  return findById(result.insertId);
}

export async function updateRole(id, { code, name, status }) {
  await pool.query("UPDATE sys_role SET code = ?, name = ?, status = ? WHERE id = ?", [code, name, status, id]);
  return findById(id);
}

export async function deleteRole(id) {
  await pool.query("DELETE FROM sys_user_role WHERE role_id = ?", [id]);
  await pool.query("DELETE FROM sys_role_menu WHERE role_id = ?", [id]);
  const [result] = await pool.query("DELETE FROM sys_role WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function assignMenus(roleId, menuIds) {
  await pool.query("DELETE FROM sys_role_menu WHERE role_id = ?", [roleId]);
  for (const mid of menuIds) {
    await pool.query("INSERT IGNORE INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)", [roleId, mid]);
  }
}

export async function getRoleMenuIds(roleId) {
  const [rows] = await pool.query("SELECT menu_id FROM sys_role_menu WHERE role_id = ?", [roleId]);
  return rows.map(r => r.menu_id);
}
