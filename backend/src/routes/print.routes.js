import { Router } from "express";
import * as printController from "../controllers/printController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const printRouter = Router();

printRouter.post("/print/pdf", requirePermission("business:print"), asyncHandler(printController.downloadPdf));
printRouter.get("/print/last-template", requirePermission("business:print"), asyncHandler(printController.getLastTemplate));
