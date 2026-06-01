import { pool } from "../config/db.js";

export async function listByType(type, { keyword, page, pageSize } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(200, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safeSize;

  let where = "WHERE business_type = ?";
  const params = [type];

  if (keyword) {
    where += " AND business_code LIKE ?";
    params.push(`%${keyword}%`);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM business_data ${where}`,
    params,
  );

  const [rows] = await pool.query(
    `SELECT * FROM business_data ${where} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, safeSize, offset],
  );

  return { rows, total };
}

export async function getById(id) {
  const [[row]] = await pool.query("SELECT * FROM business_data WHERE id = ?", [id]);
  return row || null;
}

export async function getByCode(type, businessCode) {
  const [[row]] = await pool.query(
    "SELECT * FROM business_data WHERE business_type = ? AND business_code = ?",
    [type, businessCode],
  );
  return row || null;
}

export async function create({ businessType, businessCode, businessData }) {
  const [result] = await pool.query(
    "INSERT INTO business_data (business_type, business_code, business_data) VALUES (?, ?, ?)",
    [businessType, businessCode, JSON.stringify(businessData)],
  );
  return getById(result.insertId);
}

export async function update(id, { businessCode, businessData }) {
  await pool.query(
    "UPDATE business_data SET business_code = ?, business_data = ? WHERE id = ?",
    [businessCode, JSON.stringify(businessData), id],
  );
  return getById(id);
}

export async function remove(id) {
  await pool.query("DELETE FROM business_data WHERE id = ?", [id]);
}
