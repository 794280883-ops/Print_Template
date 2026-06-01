import { Router } from "express";
import * as ctrl from "../controllers/businessDataController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const businessDataRouter = Router();

businessDataRouter.get("/business-data", asyncHandler(ctrl.list));
businessDataRouter.get("/business-data/:id", asyncHandler(ctrl.get));
businessDataRouter.post("/business-data", asyncHandler(ctrl.create));
businessDataRouter.put("/business-data/:id", asyncHandler(ctrl.update));
businessDataRouter.delete("/business-data/:id", asyncHandler(ctrl.remove));
