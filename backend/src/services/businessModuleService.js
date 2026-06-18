import * as businessModuleRepository from "../repositories/businessModuleRepository.js";
import * as fieldRepository from "../repositories/fieldRepository.js";
import { withTransaction } from "../config/db.js";
import { normalizeField } from "./fieldService.js";
import { appError } from "../utils/response.js";

const BUILT_IN_MODULES = new Set(["LOCATION", "CONTAINER", "PRODUCT"]);

export async function listModules() {
  const rows = await businessModuleRepository.listEnabledModules();
  return rows.map(toDto);
}

export async function createModule(payload = {}) {
  const code = String(payload.code || "").trim().toUpperCase();
  const name = String(payload.name || "").trim();
  const templateLabel = String(payload.templateLabel || `${name}模板`).trim();
  const dataLabel = String(payload.dataLabel || `${name}数据`).trim();
  const recordCodeField = String(payload.recordCodeField || payload.codeField || "").trim();
  const fields = Array.isArray(payload.fields) ? payload.fields.map((field) => normalizeField(field, { requireCode: true })) : [];

  if (!/^[A-Z][A-Z0-9_]{1,31}$/.test(code)) throw appError("模块编码需以大写字母开头，仅支持大写字母、数字、下划线，长度 2-32", 40000, 400);
  if (!name) throw appError("模块名称不能为空", 40000, 400);
  if (!recordCodeField) throw appError("主键字段不能为空", 40000, 400);
  if (!fields.some((field) => field.code === recordCodeField)) throw appError("主键字段必须存在于字段列表中", 40000, 400);

  try {
    const module = {
      code,
      name,
      templateLabel,
      dataLabel,
      recordCodeField,
      storageMode: "json_table",
      sortNo: Number(payload.sortNo ?? 100) || 100,
    };

    return await withTransaction(async (connection) => {
      const existing = await businessModuleRepository.getModule(code, connection);
      if (existing?.enabled) throw appError(`模块编码「${code}」已存在`, 40001, 409);

      const saved = existing
        ? await businessModuleRepository.restoreModule(module, connection)
        : await businessModuleRepository.createModule(module, connection);
      for (const field of fields) {
        await fieldRepository.upsertField(code, field, connection);
      }
      return toDto(saved);
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") throw appError("模块编码或字段编码已存在", 40001, 409);
    throw error;
  }
}

export async function deleteModule(moduleCode) {
  const code = String(moduleCode || "").trim().toUpperCase();
  if (!code) throw appError("模块编码不能为空", 40000, 400);
  if (BUILT_IN_MODULES.has(code)) throw appError("系统内置模块不能删除", 40000, 400);

  const module = await businessModuleRepository.getModule(code);
  if (!module) throw appError("模块不存在", 40400, 404);

  const affectedRows = await businessModuleRepository.disableModule(code);
  return { code, deleted: affectedRows > 0 };
}

export async function updateModule(moduleCode, payload = {}) {
  const code = String(moduleCode || "").trim().toUpperCase();
  if (!code) throw appError("模块编码不能为空", 40000, 400);

  const module = await businessModuleRepository.getModule(code);
  if (!module) throw appError("模块不存在", 40400, 404);

  const name = String(payload.name || "").trim();
  const templateLabel = String(payload.templateLabel || "").trim();
  const dataLabel = String(payload.dataLabel || "").trim();
  if (!name) throw appError("模块名称不能为空", 40000, 400);
  if (!templateLabel) throw appError("模板类型名称不能为空", 40000, 400);
  if (!dataLabel) throw appError("业务数据名称不能为空", 40000, 400);

  const updated = await businessModuleRepository.updateModule(code, { name, templateLabel, dataLabel });
  return toDto(updated);
}

function toDto(row) {
  return {
    code: row.module_code,
    name: row.module_name,
    templateLabel: row.template_label,
    dataLabel: row.data_label,
    codeField: row.record_code_field,
    recordCodeField: row.record_code_field,
    storageMode: row.storage_mode,
    enabled: Boolean(row.enabled),
    sortNo: Number(row.sort_no || 0),
  };
}
