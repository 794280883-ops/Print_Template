import { Router } from "express";
import * as businessModuleController from "../controllers/businessModuleController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const businessModuleRouter = Router();

businessModuleRouter.get("/business-modules", asyncHandler(businessModuleController.listModules));
businessModuleRouter.post("/business-modules", asyncHandler(businessModuleController.createModule));
businessModuleRouter.put("/business-modules/:moduleCode", asyncHandler(businessModuleController.updateModule));
businessModuleRouter.delete("/business-modules/:moduleCode", asyncHandler(businessModuleController.deleteModule));
businessModuleRouter.post("/business-modules/:templateType/fields", asyncHandler(businessModuleController.createField));
businessModuleRouter.put("/business-modules/:templateType/fields/:fieldCode", asyncHandler(businessModuleController.updateField));
businessModuleRouter.post("/business-modules/:templateType/fields/:fieldCode/disable", asyncHandler(businessModuleController.disableField));
