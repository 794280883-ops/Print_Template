import mysql from "mysql2/promise";
import { env } from "./env.js";

export const testDbPool = mysql.createPool({
  ...env.testDb,
  waitForConnections: true,
  connectionLimit: env.testDb.connectionLimit,
  queueLimit: 0,
  dateStrings: true,
});

export async function pingTestDatabase() {
  const connection = await testDbPool.getConnection();
  try {
    await connection.query("SELECT 1 AS ok");
    return true;
  } finally {
    connection.release();
  }
}
