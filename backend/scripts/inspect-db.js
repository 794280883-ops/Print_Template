import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { businessDataMappings } from "../src/config/businessDataMapping.js";

dotenv.config({ quiet: true });
if (process.env.ENV_FILE) dotenv.config({ path: process.env.ENV_FILE, override: true, quiet: true });

const IDENTIFIER_RE = /^[A-Za-z0-9_]+$/;
const connection = await mysql.createConnection({
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.TEST_DB_USER || process.env.DB_USER || "root",
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.TEST_DB_NAME || process.env.DB_NAME || "wms_print_template",
  dateStrings: true,
});

try {
  const [tables] = await connection.query("SHOW TABLES");
  const tableNames = tables.map((row) => Object.values(row)[0]).filter(Boolean);

  console.log("# WMS business data database inspection");
  console.log(`Database: ${process.env.TEST_DB_NAME || process.env.DB_NAME || "(default)"}`);
  console.log("\n## Candidate tables");

  for (const table of tableNames) {
    if (!isSafeIdentifier(table)) continue;
    const [[{ total }]] = await connection.query(`SELECT COUNT(*) AS total FROM ${quoteIdentifier(table)}`);
    console.log(`- ${table}: ${total} rows`);
  }

  console.log("\n## Configured mapping check");
  for (const mapping of Object.values(businessDataMappings)) {
    await inspectMapping(mapping);
  }
} finally {
  await connection.end();
}

async function inspectMapping(mapping) {
  console.log(`\n### ${mapping.code} / ${mapping.label}`);
  console.log(`Table: ${mapping.table}`);
  if (!isSafeIdentifier(mapping.table)) {
    console.log("- TODO: unsafe table identifier in mapping");
    return;
  }

  let columns = [];
  try {
    [columns] = await connection.query(`DESCRIBE ${quoteIdentifier(mapping.table)}`);
  } catch (error) {
    console.log(`- TODO: table not found or cannot be described (${error.code || error.message})`);
    return;
  }
  const columnNames = new Set(columns.map((item) => item.Field));
  const requiredColumns = new Set([
    mapping.bizCodeColumn,
    mapping.updatedAtColumn,
    mapping.typeColumn,
    mapping.fieldsJsonColumn,
    mapping.warehouse?.column,
    ...(mapping.keyword || []).map((item) => item.column),
    ...mapping.fields.map((item) => item.column),
  ].filter(Boolean));

  for (const column of requiredColumns) {
    console.log(`- ${column}: ${columnNames.has(column) ? "OK" : "TODO missing"}`);
  }

  const [sampleRows] = await connection.query(`SELECT * FROM ${quoteIdentifier(mapping.table)} LIMIT 3`);
  console.log(`Sample rows: ${sampleRows.length}`);
  if (!sampleRows.length) console.log("- TODO: table has no sample rows");
}

function quoteIdentifier(value) {
  if (!isSafeIdentifier(value)) throw new Error(`Unsafe identifier: ${value}`);
  return `\`${value}\``;
}

function isSafeIdentifier(value) {
  return IDENTIFIER_RE.test(String(value || ""));
}
