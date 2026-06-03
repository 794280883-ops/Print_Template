import { pingDatabase } from "../config/db.js";
import { pingTestDatabase } from "../config/testDb.js";
import { sendSuccess } from "../utils/response.js";

export async function health(req, res) {
  let database = "ok";
  try {
    await pingDatabase();
  } catch {
    database = "unavailable";
  }
  sendSuccess(res, { service: "ok", database });
}

export async function testDatabaseHealth(req, res) {
  await pingTestDatabase();
  sendSuccess(res, { database: "ok" });
}
