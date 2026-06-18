import { Router } from "express";
import * as businessModuleController from "../controllers/businessModuleController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const businessModuleRouter = Router();

businessModuleRouter.get("/business-modules", requirePermission("field:view"), asyncHandler(businessModuleController.listModules));
businessModuleRouter.post("/business-modules", requirePermission("field:module:create"), asyncHandler(businessModuleController.createModule));
businessModuleRouter.put("/business-modules/:moduleCode", requirePermission("field:module:edit"), asyncHandler(businessModuleController.updateModule));
businessModuleRouter.delete("/business-modules/:moduleCode", requirePermission("field:module:delete"), asyncHandler(businessModuleController.deleteModule));
businessModuleRouter.post("/business-modules/:templateType/fields", requirePermission("field:create"), asyncHandler(businessModuleController.createField));
businessModuleRouter.put("/business-modules/:templateType/fields/:fieldCode", requirePermission("field:edit"), asyncHandler(businessModuleController.updateField));
businessModuleRouter.post("/business-modules/:templateType/fields/:fieldCode/disable", requirePermission("field:disable"), asyncHandler(businessModuleController.disableField));
businessModuleRouter.post("/business-modules/:templateType/fields/:fieldCode/enable", requirePermission("field:enable"), asyncHandler(businessModuleController.enableField));
businessModuleRouter.delete("/business-modules/:templateType/fields/:fieldCode", requirePermission("field:delete"), asyncHandler(businessModuleController.deleteField));
