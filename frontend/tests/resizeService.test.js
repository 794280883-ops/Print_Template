import assert from "node:assert/strict";
import test from "node:test";
import { resizeElementFromHandle } from "../src/services/resizeService.js";

test("resizeElementFromHandle grows width when dragging the visual top handle of a 270 degree rotated element upward", () => {
  const result = resizeElementFromHandle(
    { x: 10, y: 20, width: 50, height: 12, rotate: 270 },
    "e",
    { dx: 0, dy: -8 },
  );

  assert.equal(result.x, 10);
  assert.equal(result.y, 20);
  assert.equal(result.width, 58);
  assert.equal(result.height, 12);
});
