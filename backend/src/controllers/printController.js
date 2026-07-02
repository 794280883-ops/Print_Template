import * as printService from "../services/printService.js";
import * as printRepository from "../repositories/printRepository.js";
import { appError } from "../utils/response.js";

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
    operator: req.user?.username || "Admin",
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

/**
 * Get the last template the current user printed for a business type.
 * GET /api/v1/print/last-template?businessType=LOCATION
 */
export async function getLastTemplate(req, res) {
  const businessType = String(req.query.businessType || "").toUpperCase();
  if (!businessType) throw appError("缺少业务类型", 40000, 400);
  const operator = req.user?.username || "Admin";
  const templateId = await printRepository.getLastPrintTemplate(operator, businessType);
  res.json({ code: 0, message: "success", data: { templateId } });
}
