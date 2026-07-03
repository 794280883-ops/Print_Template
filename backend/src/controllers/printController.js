import * as printService from "../services/printService.js";
import * as printRepository from "../repositories/printRepository.js";
import { generateTemplatePdf } from "../services/pdfGenerator.js";
import { appError } from "../utils/response.js";

const MAX_COPIES = 1000;
// 100条数据 × 2000份 = 200,000 页。条码模板耗时会较长，见文档说明。
const MAX_TOTAL_PAGES = 200000;

/**
 * Generate and download a PDF for template printing.
 * POST /api/v1/print/pdf
 *
 * Uses streaming mode: PDF is piped directly to the HTTP response,
 * avoiding full in-memory buffering. Good for large print jobs.
 */
export async function downloadPdf(req, res) {
  // 大份数打印可能耗时较长（20万页纯文本~3-5分钟，带条码~15-30分钟）
  req.setTimeout(30 * 60 * 1000);
  res.setTimeout(30 * 60 * 1000);

  const payload = req.body || {};

  if (!payload.templateId) {
    throw appError("缺少模板 ID", 40000, 400);
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) {
    throw appError("缺少业务数据", 40000, 400);
  }

  const requestCopies = Number(payload.copies) || 1;
  if (requestCopies > MAX_COPIES) {
    throw appError(`打印份数（${requestCopies}）超过上限（${MAX_COPIES} 份），请减少打印份数`, 40006, 400);
  }
  if (requestCopies < 1) {
    throw appError(`打印份数（${requestCopies}）不能小于 1`, 40006, 400);
  }
  const copies = requestCopies;

  // 极端场景校验：防止总页数过大导致服务器内存/超时问题
  const totalPages = rows.length * copies;
  if (totalPages > MAX_TOTAL_PAGES) {
    throw appError(
      `总打印页数（${totalPages} 页 = ${rows.length} 条数据 × ${copies} 份）超过上限（${MAX_TOTAL_PAGES} 页）。建议减少业务数据条数或打印份数`,
      40006,
      400,
    );
  }

  // 先校验模板并创建打印日志（在设置 HTTP 头之前完成）
  const { template, logEntry } = await printService.preparePrint({
    templateId: payload.templateId,
    rows,
    copies,
    businessType: payload.businessType,
    businessNo: payload.businessNo,
    warehouseCode: payload.warehouseCode,
    operator: req.user?.username || "Admin",
  });

  // 设置响应头（Content-Length 不使用，采用 chunked 流式传输）
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `${template.templateName || "print"}_${dateStr}_${timeStr}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Print-Log-Id", String(logEntry.id));

  // 流式生成 PDF，直接 pipe 到 HTTP 响应
  try {
    await generateTemplatePdf(template, rows, { copies, output: res });
  } catch (err) {
    // 流式输出中途失败时，响应头已发送，只能记录日志
    console.error("PDF streaming failed:", err.message);
    // 尝试结束响应（可能已经部分发送）
    if (!res.writableEnded) {
      res.end();
    }
  }
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
