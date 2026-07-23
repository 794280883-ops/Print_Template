import * as recordService from "../services/recordService.js";
import { compileSchema } from "../services/schemaService.js";
import { appError, sendSuccess } from "../utils/response.js";

export async function types(req, res) {
  sendSuccess(res, await recordService.listTypes());
}

export async function search(req, res) {
  sendSuccess(res, await recordService.searchRecords(req.query));
}

export async function create(req, res) {
  sendSuccess(res, await recordService.createRecord(req.body));
}

export async function update(req, res) {
  sendSuccess(res, await recordService.updateRecord(req.params.bizType, req.params.bizCode, req.body));
}

export async function remove(req, res) {
  sendSuccess(res, await recordService.deleteRecord(req.params.bizType, req.params.bizCode, req.body));
}

export async function batchRemove(req, res) {
  sendSuccess(res, await recordService.deleteRecords(req.params.bizType, req.body));
}

export async function downloadTemplate(req, res) {
  const buffer = await recordService.generateImportTemplate(req.params.bizType);
  const filename = encodeURIComponent(`${req.params.bizType}_导入模板.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function importData(req, res) {
  if (!req.file) throw appError("请上传 Excel 文件", 40000, 400);
  sendSuccess(res, await recordService.importRecords(req.params.bizType, req.file.buffer));
}

export async function exportRecords(req, res) {
  const schema = await compileSchema(req.params.bizType);
  const buffer = await recordService.exportRecords(req.params.bizType, req.query);
  const label = schema.module?.label || schema.module?.name || req.params.bizType;
  const filename = encodeURIComponent(`${label}_业务数据.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
