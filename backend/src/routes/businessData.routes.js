import { Router } from "express";
import multer from "multer";
import * as ctrl from "../controllers/businessDataController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const businessDataRouter = Router();

businessDataRouter.get("/business-data/types", requirePermission("business:view"), asyncHandler(ctrl.types));
businessDataRouter.get("/business-data/search", requirePermission("business:view"), asyncHandler(ctrl.search));
businessDataRouter.get("/business-data/template/:bizType", requirePermission("business:import"), asyncHandler(ctrl.downloadTemplate));
businessDataRouter.post("/business-data/import/:bizType", requirePermission("business:import"), upload.single("file"), asyncHandler(ctrl.importData));
businessDataRouter.post("/business-data", requirePermission("business:create"), asyncHandler(ctrl.create));
businessDataRouter.put("/business-data/:bizType/:bizCode", requirePermission("business:edit"), asyncHandler(ctrl.update));
businessDataRouter.delete("/business-data/batch/:bizType", requirePermission("business:delete"), asyncHandler(ctrl.batchRemove));
businessDataRouter.delete("/business-data/:bizType/:bizCode", requirePermission("business:delete"), asyncHandler(ctrl.remove));
