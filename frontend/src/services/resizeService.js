export function resizeElementFromHandle(element, handle, screenDelta) {
  const original = {
    x: Number(element?.x || 0),
    y: Number(element?.y || 0),
    width: Number(element?.width || 0),
    height: Number(element?.height || 0),
  };
  const { dx, dy } = toLocalDelta(screenDelta, element?.rotate);

  let x = original.x;
  let y = original.y;
  let width = original.width;
  let height = original.height;

  if (String(handle).includes("e")) width = original.width + dx;
  if (String(handle).includes("s")) height = original.height + dy;
  if (String(handle).includes("w")) {
    x = original.x + dx;
    width = original.width - dx;
  }
  if (String(handle).includes("n")) {
    y = original.y + dy;
    height = original.height - dy;
  }

  return { x, y, width, height };
}

function toLocalDelta(screenDelta, rotation) {
  const dx = Number(screenDelta?.dx || 0);
  const dy = Number(screenDelta?.dy || 0);
  const angle = normalizeRotation(rotation) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    dx: dx * cos + dy * sin,
    dy: -dx * sin + dy * cos,
  };
}

function normalizeRotation(value) {
  return ((Number(value || 0) % 360) + 360) % 360;
}
