import * as businessDataService from "../services/businessDataService.js";
import { appError, sendSuccess } from "../utils/response.js";

export async function types(req, res) {
  sendSuccess(res, await businessDataService.listBusinessTypes());
}

export async function search(req, res) {
  sendSuccess(res, await businessDataService.searchBusinessData(req.query));
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

export async function downloadTemplate(req, res) {
  const { bizType } = req.params;
  const buffer = await businessDataService.generateImportTemplate(bizType);
  const filename = encodeURIComponent(`${bizType}_导入模板.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function importData(req, res) {
  if (!req.file) throw appError("请上传 Excel 文件", 40000, 400);
  const { bizType } = req.params;
  const result = await businessDataService.importBusinessData(bizType, req.file.buffer);
  sendSuccess(res, result);
}
