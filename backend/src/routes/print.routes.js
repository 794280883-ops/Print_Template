import { Router } from "express";
import * as printController from "../controllers/printController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const printRouter = Router();

printRouter.post("/print/pdf", asyncHandler(printController.downloadPdf));
