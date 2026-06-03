import * as businessDataService from "../services/businessDataService.js";
import { sendSuccess } from "../utils/response.js";

export async function list(req, res) {
  sendSuccess(res, await businessDataService.listBusinessData(req.query.type, req.query));
}

export async function get(req, res) {
  sendSuccess(res, await businessDataService.getBusinessData(req.params.id));
}

export async function create(req, res) {
  sendSuccess(res, await businessDataService.createBusinessData(req.body));
}

export async function update(req, res) {
  sendSuccess(res, await businessDataService.updateBusinessData(req.params.id, req.body));
}

export async function importExcel(req, res) {
  sendSuccess(res, await businessDataService.importBusinessData(req.body));
}

export async function remove(req, res) {
  sendSuccess(res, await businessDataService.deleteBusinessData(req.params.id));
}
