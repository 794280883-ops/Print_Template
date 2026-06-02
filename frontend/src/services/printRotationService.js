export function normalizePrintRotation(value) {
  const angle = ((Number(value || 0) % 360) + 360) % 360;
  return [0, 90, 180, 270].includes(angle) ? angle : 0;
}

export function getPrintedSize(size, rotation) {
  const angle = normalizePrintRotation(rotation);
  if (angle === 90 || angle === 270) {
    return { ...size, width: Number(size.height), height: Number(size.width) };
  }
  return { ...size, width: Number(size.width), height: Number(size.height) };
}

export function getPrintableTemplate(template) {
  const printRotation = normalizePrintRotation(template?.printRotation);
  if (!template || !printRotation) return { ...template, printRotation };
  return {
    ...template,
    printRotation,
    size: getPrintedSize(template.size, printRotation),
    elements: rotateElementsForPrint(template.elements || [], template.size, printRotation),
  };
}

export function rotateElementsForPrint(elements, size, rotation) {
  const angle = normalizePrintRotation(rotation);
  if (!angle) return [...elements];

  const width = Number(size.width);
  const height = Number(size.height);

  return elements.map((element) => {
    const x = Number(element.x || 0);
    const y = Number(element.y || 0);
    const w = Number(element.width || 1);
    const h = Number(element.height || 1);
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    let nextCenterX = centerX;
    let nextCenterY = centerY;

    if (angle === 90) {
      nextCenterX = height - centerY;
      nextCenterY = centerX;
    } else if (angle === 180) {
      nextCenterX = width - centerX;
      nextCenterY = height - centerY;
    } else if (angle === 270) {
      nextCenterX = centerY;
      nextCenterY = width - centerX;
    }

    return {
      ...element,
      x: round2(nextCenterX - w / 2),
      y: round2(nextCenterY - h / 2),
      rotate: normalizeElementRotation(Number(element.rotate || 0) + angle),
    };
  });
}

function normalizeElementRotation(value) {
  return ((Number(value || 0) % 360) + 360) % 360;
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}
