import { Router } from "express";
import * as ctrl from "../controllers/menuController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const menuRouter = Router();
menuRouter.get("/menus", requirePermission("system:menu:view"), asyncHandler(ctrl.list));
menuRouter.post("/menus", requirePermission("system:menu:create"), asyncHandler(ctrl.create));
menuRouter.put("/menus/:id", requirePermission("system:menu:edit"), asyncHandler(ctrl.update));
menuRouter.delete("/menus/:id", requirePermission("system:menu:delete"), asyncHandler(ctrl.remove));
