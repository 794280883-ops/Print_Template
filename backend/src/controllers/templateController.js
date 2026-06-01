import * as templateService from "../services/templateService.js";
import { sendSuccess } from "../utils/response.js";

export async function listTemplates(req, res) {
  sendSuccess(res, await templateService.listTemplates(req.query));
}

export async function listOperationLogs(req, res) {
  sendSuccess(res, await templateService.listOperationLogs());
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

export async function publishTemplate(req, res) {
  sendSuccess(res, await templateService.publishTemplate(req.params.id));
}

export async function disableTemplate(req, res) {
  sendSuccess(res, await templateService.disableTemplate(req.params.id));
}

export async function copyTemplate(req, res) {
  sendSuccess(res, await templateService.copyTemplate(req.params.id));
}

export async function importTemplate(req, res) {
  sendSuccess(res, await templateService.importTemplate(req.body));
}

export async function exportTemplate(req, res) {
  sendSuccess(res, await templateService.exportTemplate(req.params.id));
}

export async function deleteTemplate(req, res) {
  sendSuccess(res, await templateService.deleteTemplate(req.params.id));
}
