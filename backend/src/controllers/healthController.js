import { pingDatabase } from "../config/db.js";
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
