export const MM_TO_PT = 72 / 25.4;
export const CSS_PX_TO_PT = 72 / 96;
export const BARCODE_HUMAN_TEXT_GAP = 2 * CSS_PX_TO_PT;

export function cssPxToPdfPt(value, fallback = 12) {
  return Number(value || fallback) * CSS_PX_TO_PT;
}

export function elementBoxToPdfPoints(element) {
  return {
    x: Number(element.x || 0) * MM_TO_PT,
    y: Number(element.y || 0) * MM_TO_PT,
    w: Number(element.width || 0) * MM_TO_PT,
    h: Number(element.height || 0) * MM_TO_PT,
  };
}

export function getTextLayout(element, box) {
  const fontSize = cssPxToPdfPt(element.fontSize);
  const textHeight = fontSize * 1.2;
  return {
    x: box.x,
    y: box.y + Math.max(0, (box.h - textHeight) / 2),
    fontSize,
    options: {
      width: box.w,
      height: box.h,
      align: normalizeTextAlign(element.align),
      lineBreak: false,
      ellipsis: true,
    },
  };
}

export function getBarcodeLayout(element, box) {
  const showHumanText = element.showHumanText !== false;
  if (!showHumanText) {
    return {
      showHumanText,
      barcodeBox: box,
      textBox: null,
      humanTextFontSize: 0,
    };
  }

  const humanTextFontSize = cssPxToPdfPt(element.humanTextFontSize, 8);
  const humanTextGap = BARCODE_HUMAN_TEXT_GAP;
  const textHeight = humanTextFontSize * 1.2;
  const barcodeHeight = Math.max(box.h - textHeight - humanTextGap, box.h * 0.5);

  return {
    showHumanText,
    barcodeBox: {
      x: box.x,
      y: box.y,
      w: box.w,
      h: barcodeHeight,
    },
    textBox: {
      x: box.x,
      y: box.y + barcodeHeight + humanTextGap,
      w: box.w,
      h: box.h - barcodeHeight - humanTextGap,
    },
    humanTextFontSize,
    humanTextGap,
  };
}

function normalizeTextAlign(align) {
  return ["left", "center", "right"].includes(align) ? align : "left";
}
