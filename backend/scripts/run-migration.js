import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dbName = process.env.DB_NAME || "wms_print_template";

const serverConnection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
});

await serverConnection.query(
  `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await serverConnection.end();

const dbConnection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName,
  multipleStatements: true,
});

const migrationDir = path.join(root, "migrations");
const migrationFiles = (await fs.readdir(migrationDir))
  .filter((file) => file.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

// Ensure tracking table exists (create if not, 001_init.sql also does this)
await dbConnection.query(
  `CREATE TABLE IF NOT EXISTS _migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
);

// Get already applied migrations
const [applied] = await dbConnection.query("SELECT filename FROM _migrations");
const appliedSet = new Set(applied.map((r) => r.filename));

let appliedCount = 0;
let skippedCount = 0;

for (const file of migrationFiles) {
  if (appliedSet.has(file)) {
    skippedCount++;
    continue;
  }
  const sql = await fs.readFile(path.join(migrationDir, file), "utf8");
  await dbConnection.query(sql);
  await dbConnection.query("INSERT INTO _migrations (filename) VALUES (?)", [file]);
  appliedCount++;
  console.log(`Applied ${file}`);
}

await dbConnection.end();

console.log(
  `Migration completed for database ${dbName}: ${appliedCount} new, ${skippedCount} skipped`
);
