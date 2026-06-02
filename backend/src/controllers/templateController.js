import * as templateService from "../services/templateService.js";
import { sendSuccess } from "../utils/response.js";

export async function listTemplates(req, res) {
  sendSuccess(res, await templateService.listTemplates(req.query));
}

export async function getTemplate(req, res) {
  sendSuccess(res, await templateService.getTemplate(req.params.id));
}

export async function recordDesignLog(req, res) {
  sendSuccess(res, await templateService.recordDesignLog(req.params.id));
}

export async function createTemplate(req, res) {
  sendSuccess(res, await templateService.createTemplate(req.body));
}

export async function updateTemplate(req, res) {
  sendSuccess(res, await templateService.updateTemplate(req.params.id, req.body));
}

export async function updateTemplateName(req, res) {
  sendSuccess(res, await templateService.updateTemplateName(req.params.id, req.body));
}

export async function enableTemplate(req, res) {
  sendSuccess(res, await templateService.enableTemplate(req.params.id));
}

export async function disableTemplate(req, res) {
  sendSuccess(res, await templateService.disableTemplate(req.params.id));
}

export async function updateTemplatesStatus(req, res) {
  sendSuccess(res, await templateService.updateTemplatesStatus(req.body));
}

export async function copyTemplate(req, res) {
  sendSuccess(res, await templateService.copyTemplate(req.params.id));
}

export async function deleteTemplate(req, res) {
  sendSuccess(res, await templateService.deleteTemplate(req.params.id));
}
