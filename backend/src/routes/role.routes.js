import { Router } from "express";
import * as ctrl from "../controllers/roleController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const roleRouter = Router();
roleRouter.get("/roles", requirePermission("system:role:view"), asyncHandler(ctrl.list));
roleRouter.post("/roles", requirePermission("system:role:create"), asyncHandler(ctrl.create));
roleRouter.put("/roles/:id", requirePermission("system:role:edit"), asyncHandler(ctrl.update));
roleRouter.delete("/roles/:id", requirePermission("system:role:delete"), asyncHandler(ctrl.remove));
roleRouter.get("/roles/:id/menus", requirePermission("system:role:view"), asyncHandler(ctrl.getMenus));
roleRouter.put("/roles/:id/menus", requirePermission("system:role:edit"), asyncHandler(ctrl.assignMenus));
