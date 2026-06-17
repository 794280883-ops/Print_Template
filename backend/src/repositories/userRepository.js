import { pool } from "../config/db.js";

export async function findByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM sys_user WHERE username = ?", [username]);
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.query("SELECT id, username, nickname, avatar, email, status, created_at FROM sys_user WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function getUserRoleIds(userId) {
  const [rows] = await pool.query("SELECT role_id FROM sys_user_role WHERE user_id = ?", [userId]);
  return rows.map(r => r.role_id);
}

export async function listUsers({ page = 1, pageSize = 20, keyword = "" }) {
  const offset = Math.max(0, (page - 1) * pageSize);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  const where = keyword ? "WHERE username LIKE ? OR nickname LIKE ?" : "";
  const kwParams = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM sys_user ${where}`, kwParams);
  const [rows] = await pool.query(
    `SELECT id, username, nickname, avatar, email, status, created_at FROM sys_user ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...kwParams, safeSize, offset],
  );
  for (const row of rows) {
    row.roleIds = await getUserRoleIds(row.id);
  }
  return { rows, total, page, pageSize: safeSize };
}

export async function createUser({ username, password, nickname, email, roleIds = [] }) {
  const [result] = await pool.query(
    "INSERT INTO sys_user (username, password, nickname, email) VALUES (?, ?, ?, ?)",
    [username, password, nickname, email],
  );
  for (const rid of roleIds) {
    await pool.query("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (?, ?)", [result.insertId, rid]);
  }
  return findById(result.insertId);
}

export async function updateUser(id, { nickname, email, status, roleIds }) {
  await pool.query("UPDATE sys_user SET nickname = ?, email = ?, status = ? WHERE id = ?", [nickname, email, status, id]);
  if (roleIds !== undefined && roleIds !== null) {
    await pool.query("DELETE FROM sys_user_role WHERE user_id = ?", [id]);
    for (const rid of roleIds) {
      await pool.query("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (?, ?)", [id, rid]);
    }
  }
  return findById(id);
}

export async function changePassword(id, hashedPassword) {
  const [result] = await pool.query("UPDATE sys_user SET password = ? WHERE id = ?", [hashedPassword, id]);
  return result.affectedRows;
}

export async function deleteUser(id) {
  await pool.query("DELETE FROM sys_user_role WHERE user_id = ?", [id]);
  const [result] = await pool.query("DELETE FROM sys_user WHERE id = ?", [id]);
  return result.affectedRows;
}
