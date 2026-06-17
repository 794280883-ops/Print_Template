import * as fieldService from "../services/fieldService.js";
import { sendSuccess } from "../utils/response.js";

export async function listFields(req, res) {
  sendSuccess(res, await fieldService.listFields(req.params.moduleCode));
}
