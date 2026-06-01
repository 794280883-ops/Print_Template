import * as printService from "../services/printService.js";
import { sendSuccess } from "../utils/response.js";
import { appError } from "../utils/response.js";

export async function previewPrint(req, res) {
  sendSuccess(res, await printService.previewPrint(req.body));
}

export async function submitPrint(req, res) {
  sendSuccess(res, await printService.submitPrint(req.body));
}

export async function listPrintLogs(req, res) {
  sendSuccess(res, await printService.listPrintLogs());
}

/**
 * Generate and download a PDF for template printing.
 * POST /api/v1/print/pdf
 */
export async function downloadPdf(req, res) {
  const payload = req.body || {};

  if (!payload.templateId) {
    throw appError("缺少模板 ID", 40000, 400);
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) {
    throw appError("缺少业务数据", 40000, 400);
  }

  const { pdfBuffer, logEntry, templateName } = await printService.generatePdf({
    templateId: payload.templateId,
    rows,
    copies: Number(payload.copies) || 1,
    businessType: payload.businessType,
    businessNo: payload.businessNo,
    warehouseCode: payload.warehouseCode,
    operator: payload.operator,
  });

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `${templateName || "print"}_${dateStr}_${timeStr}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  res.setHeader("X-Print-Log-Id", String(logEntry.id));

  res.end(pdfBuffer);
}
