import * as printRepository from "../repositories/printRepository.js";
import { getTemplate } from "./templateService.js";
import { generateTemplatePdf } from "./pdfGenerator.js";

export async function previewPrint(payload) {
  const template = await getTemplate(payload.templateId);
  return {
    template,
    data: payload.data || {},
  };
}

export async function submitPrint(payload) {
  return printRepository.createPrintLog(payload);
}

export async function listPrintLogs() {
  return printRepository.listPrintLogs();
}

/**
 * Generate a PDF file for a template filled with business data.
 * Returns both the PDF buffer and the print log record.
 */
export async function generatePdf(payload) {
  const { templateId, rows = [], copies = 1 } = payload;

  // Fetch the full template with elements
  const template = await getTemplate(templateId);

  // Generate PDF
  const pdfBuffer = await generateTemplatePdf(template, rows, { copies });

  // Log the print operation
  const logEntry = await printRepository.createPrintLog({
    templateId: template.id,
    templateCode: payload.templateCode || template.templateCode,
    businessType: payload.businessType || template.templateType,
    businessNo: payload.businessNo || rows.map((r, i) => r?.code || `row-${i + 1}`).join(", "),
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

  return { pdfBuffer, logEntry };
}
