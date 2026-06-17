import { Router } from "express";
import * as ctrl from "../controllers/menuController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const menuRouter = Router();
menuRouter.get("/menus", asyncHandler(ctrl.list));
menuRouter.post("/menus", asyncHandler(ctrl.create));
menuRouter.put("/menus/:id", asyncHandler(ctrl.update));
menuRouter.delete("/menus/:id", asyncHandler(ctrl.remove));
