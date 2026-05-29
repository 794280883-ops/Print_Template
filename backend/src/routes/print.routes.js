import { Router } from "express";
import * as printController from "../controllers/printController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const printRouter = Router();

printRouter.post("/print/preview", asyncHandler(printController.previewPrint));
printRouter.post("/print/submit", asyncHandler(printController.submitPrint));
printRouter.get("/print/logs", asyncHandler(printController.listPrintLogs));
