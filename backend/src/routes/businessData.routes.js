import { Router } from "express";
import multer from "multer";
import * as ctrl from "../controllers/businessDataController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const businessDataRouter = Router();

businessDataRouter.get("/business-data/types", asyncHandler(ctrl.types));
businessDataRouter.get("/business-data/warehouses", asyncHandler(ctrl.warehouses));
businessDataRouter.get("/business-data/search", asyncHandler(ctrl.search));
businessDataRouter.get("/business-data/template/:bizType", asyncHandler(ctrl.downloadTemplate));
businessDataRouter.get("/business-data/detail/:bizType/:bizCode", asyncHandler(ctrl.detail));
businessDataRouter.post("/business-data/import/:bizType", upload.single("file"), asyncHandler(ctrl.importData));
businessDataRouter.post("/business-data", asyncHandler(ctrl.create));
businessDataRouter.put("/business-data/:bizType/:bizCode", asyncHandler(ctrl.update));
businessDataRouter.delete("/business-data/:bizType/:bizCode", asyncHandler(ctrl.remove));
businessDataRouter.get("/business-data", asyncHandler(ctrl.search));
