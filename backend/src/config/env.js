import dotenv from "dotenv";

dotenv.config({ quiet: true });
if (process.env.ENV_FILE) dotenv.config({ path: process.env.ENV_FILE, override: true, quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === "production" ? "" : "wms-print-template-jwt-secret");

if (nodeEnv === "production" && !jwtSecret) {
  throw new Error("JWT_SECRET must be configured in production");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "http://127.0.0.1:5173",
  jwtSecret,
  pdf: {
    cjkFontPath: process.env.PDF_CJK_FONT_PATH || new URL("../../fonts/ArialUnicode.ttf", import.meta.url).pathname,
  },
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wms_print_template",
  },
  testDb: {
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT || 3306),
    user: process.env.TEST_DB_USER || process.env.DB_USER || "root",
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.TEST_DB_NAME || process.env.DB_NAME || "wms_print_template",
    connectionLimit: Number(process.env.TEST_DB_CONNECTION_LIMIT || 5),
  },
};
