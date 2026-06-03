import { Router } from "express";
import * as ctrl from "../controllers/businessDataController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const businessDataRouter = Router();

businessDataRouter.get("/business-data/types", asyncHandler(ctrl.types));
businessDataRouter.get("/business-data/warehouses", asyncHandler(ctrl.warehouses));
businessDataRouter.get("/business-data/search", asyncHandler(ctrl.search));
businessDataRouter.get("/business-data/detail/:bizType/:bizCode", asyncHandler(ctrl.detail));
businessDataRouter.get("/business-data", asyncHandler(ctrl.search));
