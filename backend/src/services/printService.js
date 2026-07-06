import * as printRepository from "../repositories/printRepository.js";
import * as recordRepository from "../repositories/recordRepository.js";
import { getTemplate } from "./templateService.js";
import { generateTemplatePdf, validateTemplateBarcodeValues } from "./pdfGenerator.js";
import { appError } from "../utils/response.js";

/**
 * Build a safe business_no value for the print_log table.
 * After migration 005 the column is TEXT (was VARCHAR(128)).
 * Truncate at 2048 chars to prevent abuse while supporting bulk prints (~80+ records).
 */
const BUSINESS_NO_MAX = 2048;
function buildBusinessNo(rows, fallback) {
  if (fallback) return fallback.length > BUSINESS_NO_MAX ? fallback.slice(0, BUSINESS_NO_MAX - 3) + "..." : fallback;
  const joined = rows.map((r, i) => r?.code || r?.businessCode || r?.recordCode || `row-${i + 1}`).join(", ");
  return joined.length > BUSINESS_NO_MAX ? joined.slice(0, BUSINESS_NO_MAX - 3) + "..." : joined;
}

/**
 * Validate the print request and create a print log entry.
 * Called BEFORE PDF generation so the filename and headers can be set.
 * Returns the template object and the log entry.
 */
export async function preparePrint(payload) {
  const { templateId, rows = [], copies = 1 } = payload;

  // Fetch the full template with elements
  const template = await getTemplate(templateId);
  assertTemplateEnabled(template);
  assertBusinessTypeMatchesTemplate(template, payload.businessType);
  await assertBarcodeValuesPrintable(template, rows);

  // Create print log entry (status will be updated after streaming completes)
  const logEntry = await printRepository.createPrintLog({
    templateId: template.id,
    templateCode: payload.templateCode || template.templateCode,
    businessType: payload.businessType || template.templateType,
    businessNo: buildBusinessNo(rows, payload.businessNo),
    warehouseCode: payload.warehouseCode || rows[0]?.warehouseCode || "",
    printPayload: {
      rows,
      copies,
      printMode: payload.printMode || "PDF打印",
      pdfGenerated: true,
    },
    printStatus: "success",
    operator: payload.operator || "Admin",
  });

  return { template, logEntry };
}

/**
 * Generate a PDF file for a template filled with business data.
 * Returns both the PDF buffer and the print log record.
 * (Buffer mode — backward compatible)
 */
export async function generatePdf(payload) {
  const { templateId, rows = [], copies = 1 } = payload;

  // Fetch the full template with elements
  const template = await getTemplate(templateId);
  assertTemplateEnabled(template);
  assertBusinessTypeMatchesTemplate(template, payload.businessType);
  await assertBarcodeValuesPrintable(template, rows);

  // Generate PDF
  const pdfBuffer = await generateTemplatePdf(template, rows, { copies });

  // Log the print operation
  const logEntry = await printRepository.createPrintLog({
    templateId: template.id,
    templateCode: payload.templateCode || template.templateCode,
    businessType: payload.businessType || template.templateType,
    businessNo: buildBusinessNo(rows, payload.businessNo),
    warehouseCode: payload.warehouseCode || rows[0]?.warehouseCode || "",
    printPayload: {
      rows,
      copies,
      printMode: payload.printMode || "PDF打印",
      pdfGenerated: true,
    },
    printStatus: "success",
    operator: payload.operator || "Admin",
  });

  await incrementPrintedRecords(rows);

  return { pdfBuffer, logEntry, templateName: template.templateName };
}

export function collectPrintedRecordIds(rows = []) {
  const ids = [];
  const seen = new Set();
  for (const row of rows) {
    const id = Number(row?._dbId);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export async function incrementPrintedRecords(rows = [], _options = {}, repository = recordRepository) {
  const ids = collectPrintedRecordIds(rows);
  if (!ids.length) return 0;
  return repository.incrementPrintCountByIds(ids);
}

function assertTemplateEnabled(template) {
  if (template.status !== "enabled") {
    throw appError("模板未启用，不能打印", 40004, 400);
  }
}

function assertBusinessTypeMatchesTemplate(template, businessType) {
  if (!businessType) return;
  if (String(businessType).toUpperCase() !== String(template.templateType).toUpperCase()) {
    throw appError("业务类型与模板类型不一致，不能打印", 40005, 400);
  }
}

async function assertBarcodeValuesPrintable(template, rows) {
  const issues = await validateTemplateBarcodeValues(template, rows);
  if (!issues.length) return;
  const first = issues[0];
  const more = issues.length > 1 ? `，另有 ${issues.length - 1} 处问题` : "";
  throw appError(`条码数据不符合码制要求：${first.message}${more}`, 40007, 400, { issues });
}
