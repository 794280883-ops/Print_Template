import * as businessModuleService from "../services/businessModuleService.js";
import * as fieldService from "../services/fieldService.js";
import { sendSuccess } from "../utils/response.js";

export async function listModules(req, res) {
  sendSuccess(res, await businessModuleService.listModules());
}

export async function createModule(req, res) {
  sendSuccess(res, await businessModuleService.createModule(req.body));
}

export async function updateModule(req, res) {
  sendSuccess(res, await businessModuleService.updateModule(req.params.moduleCode, req.body));
}

export async function deleteModule(req, res) {
  sendSuccess(res, await businessModuleService.deleteModule(req.params.moduleCode));
}

export async function createField(req, res) {
  sendSuccess(res, await fieldService.createField(req.params.templateType, req.body));
}

export async function updateField(req, res) {
  sendSuccess(res, await fieldService.updateField(req.params.templateType, req.params.fieldCode, req.body));
}

export async function disableField(req, res) {
  sendSuccess(res, await fieldService.disableField(req.params.templateType, req.params.fieldCode));
}
