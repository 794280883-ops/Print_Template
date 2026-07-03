import * as printRepository from "../repositories/printRepository.js";
import { getTemplate } from "./templateService.js";
import { generateTemplatePdf } from "./pdfGenerator.js";
import { appError } from "../utils/response.js";

/**
 * Build a safe business_no value that fits the print_log.business_no column.
 * Column is VARCHAR(128), so truncate with "..." if the joined codes exceed 125 chars.
 */
function buildBusinessNo(rows, fallback) {
  if (fallback) return fallback.slice(0, 128);
  const joined = rows.map((r, i) => r?.code || r?.businessCode || r?.recordCode || `row-${i + 1}`).join(", ");
  return joined.length > 125 ? joined.slice(0, 122) + "..." : joined;
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

  return { pdfBuffer, logEntry, templateName: template.templateName };
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
