export const MM_TO_PT = 72 / 25.4;
export const CSS_PX_TO_PT = 72 / 96;

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

function normalizeTextAlign(align) {
  return ["left", "center", "right"].includes(align) ? align : "left";
}
