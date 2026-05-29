import * as printService from "../services/printService.js";
import { sendSuccess } from "../utils/response.js";

export async function previewPrint(req, res) {
  sendSuccess(res, await printService.previewPrint(req.body));
}

export async function submitPrint(req, res) {
  sendSuccess(res, await printService.submitPrint(req.body));
}

export async function listPrintLogs(req, res) {
  sendSuccess(res, await printService.listPrintLogs());
}
