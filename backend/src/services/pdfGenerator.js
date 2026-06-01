import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { Buffer } from "node:buffer";

// mm to PDF points (1 mm = 72 / 25.4 points ≈ 2.8346)
const MM_TO_PT = 72 / 25.4;

// macOS full CJK font (TTF format required for pdfkit; subset fonts like Hei/Kai have broken cmap)
const CJK_FONT_PATH = "/Library/Fonts/Arial Unicode.ttf";

/**
 * Generate a PDF buffer from a template and data rows.
 * Each data row produces a separate page.
 *
 * @param {Object} template - template object with size and elements
 * @param {Array<Object>} dataRows - array of data objects for field substitution
 * @param {Object} [options]
 * @param {number} [options.copies=1] - number of copies per data row
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateTemplatePdf(template, dataRows, options = {}) {
  const copies = Math.max(1, options.copies || 1);
  const { size, elements = [] } = template;

  const pageWidthPt = size.width * MM_TO_PT;
  const pageHeightPt = size.height * MM_TO_PT;

  const doc = new PDFDocument({
    size: [pageWidthPt, pageHeightPt],
    margin: 0,
    autoFirstPage: false,
    bufferPages: true,
  });

  // Collect PDF data
  const pdfPromise = new Promise((resolve, reject) => {
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });

  // Register CJK font for Chinese text
  let cjkFontRegistered = false;
  const ensureCjkFont = () => {
    if (!cjkFontRegistered) {
      try {
        doc.registerFont("CJK", CJK_FONT_PATH);
        cjkFontRegistered = true;
      } catch (err) {
        console.error("CJK font registration failed:", err.message);
        throw err;
      }
    }
  };

  // Sort elements by zIndex
  const sorted = [...elements].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  // Generate pages
  for (const dataRow of dataRows) {
    if (!dataRow) continue;
    for (let copy = 0; copy < copies; copy++) {
      doc.addPage({ size: [pageWidthPt, pageHeightPt], margin: 0 });
      await renderPage(doc, sorted, dataRow, size, ensureCjkFont);
    }
  }

  doc.end();

  return pdfPromise;
}

async function renderPage(doc, elements, data, templateSize, ensureCjkFont) {
  for (const el of elements) {
    await renderElement(doc, el, data, ensureCjkFont);
  }
}

async function renderElement(doc, el, data, ensureCjkFont) {
  const x = el.x * MM_TO_PT;
  const y = el.y * MM_TO_PT;
  const w = el.width * MM_TO_PT;
  const h = el.height * MM_TO_PT;

  // Handle rotation around element center
  // IMPORTANT: pdfkit rotate(angle) uses RADIANS, but rotate(angle, {origin}) uses DEGREES
  if (el.rotate) {
    doc.save();
    doc.rotate(el.rotate, { origin: [x + w / 2, y + h / 2] });
  }

  try {
    switch (el.type) {
      case "text":
        renderText(doc, el, data, x, y, w, h, ensureCjkFont);
        break;
      case "barcode":
        await renderBarcode(doc, el, data, x, y, w, h);
        break;
      case "qrcode":
        await renderQrcode(doc, el, data, x, y, w, h);
        break;
      case "line":
        renderLine(doc, el, x, y, w, h);
        break;
      case "rect":
        renderRect(doc, el, x, y, w, h);
        break;
      case "image":
        await renderImage(doc, el, x, y, w, h);
        break;
      case "checkbox":
        renderCheckbox(doc, el, x, y, w, h, ensureCjkFont);
        break;
      default:
        break;
    }
  } catch (err) {
    // Log but continue rendering other elements
    console.error(`Error rendering element ${el.id} (${el.type}):`, err.message);
  }

  if (el.rotate) {
    doc.restore();
  }
}

// ── Text ────────────────────────────────────────────
let cjkFontAvailable = true;

// Direction label → arrow symbol mapping
const DIR_ARROWS = { "向上": "↑", "向下": "↓", "向左": "←", "向右": "→" };
function dirArrow(v) { return DIR_ARROWS[v] || v; }

function renderText(doc, el, data, x, y, w, h, ensureCjkFont) {
  // When bindField exists and data provides the value, always use field value (print mode)
  // Otherwise use static text (designer placeholder)
  const rawValue = (el.bindField && data[el.bindField] !== undefined)
    ? String(data[el.bindField])
    : el.textKind === "field"
      ? `[${el.bindField || "未绑定"}]`
      : (el.text ?? "静态文本");

  if (!rawValue) return;

  const value = dirArrow(rawValue);

  const fontSize = el.fontSize || 12;
  const color = el.color || "#111827";
  const align = el.align || "left";

  // Use CJK font for Chinese text; fall back to Helvetica if unavailable
  if (cjkFontAvailable) {
    try {
      ensureCjkFont();
      doc.font("CJK");
    } catch {
      cjkFontAvailable = false;
    }
  }
  if (!cjkFontAvailable) {
    doc.font("Helvetica");
  }

  doc.fontSize(fontSize).fillColor(color);

  const textHeight = fontSize * 1.2;
  const textY = y + (h - textHeight) / 2;

  doc.text(value, x, textY, {
    width: w,
    align,
    height: h,
    lineBreak: false,
  });
}

// ── Barcode ─────────────────────────────────────────
async function renderBarcode(doc, el, data, x, y, w, h) {
  const value = String(data[el.bindField] ?? el.bindField ?? "123456");
  if (!value) return;

  try {
    // bwip-js height in mm, scale controls resolution (higher = sharper)
    const heightMm = h / MM_TO_PT;
    const widthMm = w / MM_TO_PT;
    const pngBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: value,
      scale: 5,
      height: heightMm,
      width: widthMm,
      includetext: true,
      textxalign: "center",
      textsize: 10,
      paddingwidth: 0,
      paddingheight: 0,
    });

    // Render barcode at exact element dimensions to match preview layout
    doc.image(pngBuffer, x, y, { width: w, height: h });
  } catch (err) {
    // Fallback: draw a placeholder with the value
    doc.font("Helvetica").fontSize(8).fillColor("#666")
      .text(`[Barcode: ${value}]`, x, y, { width: w, height: h, align: "center" });
  }
}

// ── QR Code ─────────────────────────────────────────
async function renderQrcode(doc, el, data, x, y, w, h) {
  const value = String(data[el.bindField] ?? el.bindField ?? "https://example.com");
  if (!value) return;

  try {
    // Generate QR code as PNG data URL
    const dataUrl = await QRCode.toDataURL(value, {
      width: Math.round(w / MM_TO_PT * 3), // higher resolution for quality
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Convert data URL to buffer
    const base64 = dataUrl.split(",")[1];
    const pngBuffer = Buffer.from(base64, "base64");

    doc.image(pngBuffer, x, y, { width: w, height: h });
  } catch (err) {
    // Fallback: placeholder text
    doc.font("Helvetica").fontSize(8).fillColor("#666")
      .text(`[QR: ${value}]`, x, y, { width: w, height: h, align: "center" });
  }
}

// ── Line ────────────────────────────────────────────
function renderLine(doc, el, x, y, w, h) {
  const color = el.color || "#111827";
  doc.lineWidth(1).strokeColor(color);

  if (h <= w) {
    // Horizontal line
    doc.moveTo(x, y + h / 2).lineTo(x + w, y + h / 2).stroke();
  } else {
    // Vertical line
    doc.moveTo(x + w / 2, y).lineTo(x + w / 2, y + h).stroke();
  }
}

// ── Rect ────────────────────────────────────────────
function renderRect(doc, el, x, y, w, h) {
  const bgColor = el.backgroundColor || "#eaf4ff";
  const strokeColor = el.color || "#111827";

  doc.rect(x, y, w, h).fillAndStroke(bgColor, strokeColor);
}

// ── Image ───────────────────────────────────────────
async function renderImage(doc, el, x, y, w, h) {
  const url = el.imageUrl;
  if (!url) {
    doc.font("Helvetica").fontSize(8).fillColor("#999")
      .text("[图片]", x, y, { width: w, height: h, align: "center" });
    return;
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    doc.image(imageBuffer, x, y, { width: w, height: h });
  } catch (err) {
    // Fallback placeholder
    doc.font("Helvetica").fontSize(8).fillColor("#999")
      .text("[图片加载失败]", x, y, { width: w, height: h, align: "center" });
  }
}

// ── Checkbox ────────────────────────────────────────
function renderCheckbox(doc, el, x, y, w, h, ensureCjkFont) {
  const boxSize = Math.min(h, 12);
  const boxX = x;
  const boxY = y + (h - boxSize) / 2;

  // Draw box
  doc.rect(boxX, boxY, boxSize, boxSize).stroke("#111827");

  // Draw checkmark if checked
  if (el.checked) {
    doc.fontSize(boxSize * 0.8).fillColor("#111827").text("✓", boxX + boxSize * 0.1, boxY - boxSize * 0.05, {
      width: boxSize,
      align: "center",
    });
  }

  // Draw label if present (use CJK font for Chinese text support)
  if (el.text) {
    const textX = boxX + boxSize + 4;
    const textW = w - boxSize - 4;
    if (cjkFontAvailable) {
      try {
        ensureCjkFont();
        doc.font("CJK");
      } catch {
        cjkFontAvailable = false;
      }
    }
    if (!cjkFontAvailable) {
      doc.font("Helvetica");
    }
    doc.fontSize(el.fontSize || 10).fillColor(el.color || "#111827")
      .text(el.text, textX, y, { width: textW, height: h, ellipsis: true });
  }
}
