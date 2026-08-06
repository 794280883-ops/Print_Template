import assert from "node:assert/strict";
import test from "node:test";
import { requirePermission } from "../src/middlewares/auth.js";

function runPermissionCheck(required, permissions) {
  let nextError;
  requirePermission(required)({ permissions }, {}, (error) => {
    nextError = error;
  });
  return nextError;
}

test("requirePermission allows either field:view or business:view to read business modules", () => {
  assert.equal(runPermissionCheck(["field:view", "business:view"], ["field:view"]), undefined);
  assert.equal(runPermissionCheck(["field:view", "business:view"], ["business:view"]), undefined);
});

test("requirePermission rejects users without either module-list permission", () => {
  const error = runPermissionCheck(["field:view", "business:view"], ["business:create"]);
  assert.equal(error?.code, 40300);
});
