export const BARCODE_HUMAN_TEXT_GAP = 2;

export function isBarcodeHumanTextVisible(element) {
  return element?.type === "barcode" && element.showHumanText !== false;
}

export function getBarcodeHumanTextFontSize(element, scale = 1) {
  return Number(element?.humanTextFontSize || 8) * Number(scale || 1);
}

export function getBarcodeBarStyle(element, scale = 1) {
  if (!isBarcodeHumanTextVisible(element)) {
    return { flex: "0 0 auto", height: "100%" };
  }
  const reservedHeight = getBarcodeHumanTextFontSize(element, scale) + BARCODE_HUMAN_TEXT_GAP * Number(scale || 1);
  return {
    flex: "0 0 auto",
    height: `calc(100% - ${reservedHeight}px)`,
  };
}

export function getBarcodeHumanText(element, data = {}) {
  if (!isBarcodeHumanTextVisible(element)) return "";
  const bindField = element?.bindField;
  const value = bindField ? data?.[bindField] : "";
  return String(value ?? bindField ?? "");
}
