import { pool } from "../config/db.js";

export async function getPermissionCodesByRole(roleId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT m.permission_code FROM sys_menu m
     INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
     WHERE rm.role_id = ? AND m.status = 1 AND m.permission_code IS NOT NULL AND m.permission_code <> ''`,
    [roleId],
  );
  return rows.map(r => r.permission_code);
}

export async function getMenuIdsByRole(roleId) {
  const [rows] = await pool.query("SELECT menu_id FROM sys_role_menu WHERE role_id = ?", [roleId]);
  return rows.map(r => r.menu_id);
}

export async function getMenuTree(allowedMenuIds) {
  const [rows] = await pool.query("SELECT * FROM sys_menu WHERE status = 1 ORDER BY sort_no ASC, id ASC");
  const allowed = new Set(allowedMenuIds);
  const filtered = rows.filter(r => r.type === "directory" || allowed.has(r.id));
  const tree = buildTree(filtered, 0);
  // Remove empty directories (no visible children)
  return tree.filter(dir => dir.children && dir.children.length > 0);
}

function buildTree(rows, parentId) {
  return rows
    .filter(r => r.parent_id === parentId)
    .map(r => ({ ...r, children: buildTree(rows, r.id) }));
}

export async function listAllMenus() {
  const [rows] = await pool.query("SELECT * FROM sys_menu ORDER BY sort_no ASC, id ASC");
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM sys_menu WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function createMenu(data) {
  const [result] = await pool.query(
    `INSERT INTO sys_menu (parent_id, name, type, path, component, permission_code, icon, sort_no, visible, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.parent_id, data.name, data.type, data.path, data.component, data.permission_code, data.icon, data.sort_no, data.visible, data.status],
  );
  return findById(result.insertId);
}

export async function updateMenu(id, data) {
  await pool.query(
    `UPDATE sys_menu SET parent_id=?, name=?, type=?, path=?, component=?, permission_code=?, icon=?, sort_no=?, visible=?, status=?
     WHERE id=?`,
    [data.parent_id, data.name, data.type, data.path, data.component, data.permission_code, data.icon, data.sort_no, data.visible, data.status, id],
  );
  return findById(id);
}

export async function deleteMenu(id) {
  await pool.query("DELETE FROM sys_role_menu WHERE menu_id = ?", [id]);
  await pool.query("DELETE FROM sys_menu WHERE parent_id = ?", [id]);
  const [result] = await pool.query("DELETE FROM sys_menu WHERE id = ?", [id]);
  return result.affectedRows;
}
