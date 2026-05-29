import * as aiService from "../services/aiService.js";
import { sendSuccess } from "../utils/response.js";

export async function generateTemplateDraft(req, res) {
  sendSuccess(res, await aiService.generateTemplateDraft(req.body));
}
