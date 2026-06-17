import { Router } from "express";
import * as ctrl from "../controllers/roleController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const roleRouter = Router();
roleRouter.get("/roles", asyncHandler(ctrl.list));
roleRouter.post("/roles", asyncHandler(ctrl.create));
roleRouter.put("/roles/:id", asyncHandler(ctrl.update));
roleRouter.delete("/roles/:id", asyncHandler(ctrl.remove));
roleRouter.get("/roles/:id/menus", asyncHandler(ctrl.getMenus));
roleRouter.put("/roles/:id/menus", asyncHandler(ctrl.assignMenus));
