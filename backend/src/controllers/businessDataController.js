import * as businessDataService from "../services/businessDataService.js";
import { sendSuccess } from "../utils/response.js";

export function types(req, res) {
  sendSuccess(res, businessDataService.listBusinessTypes());
}

export async function warehouses(req, res) {
  sendSuccess(res, await businessDataService.listWarehouses(req.query));
}

export async function search(req, res) {
  sendSuccess(res, await businessDataService.searchBusinessData(req.query));
}

export async function detail(req, res) {
  sendSuccess(res, await businessDataService.getBusinessDataDetail(req.params.bizType, req.params.bizCode));
}

export async function create(req, res) {
  sendSuccess(res, await businessDataService.createBusinessData(req.body));
}

export async function update(req, res) {
  sendSuccess(res, await businessDataService.updateBusinessData(req.params.bizType, req.params.bizCode, req.body));
}

export async function remove(req, res) {
  sendSuccess(res, await businessDataService.deleteBusinessData(req.params.bizType, req.params.bizCode));
}
