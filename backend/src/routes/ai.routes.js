import { Router } from "express";
import * as aiController from "../controllers/aiController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const aiRouter = Router();

aiRouter.post("/ai/templates/generate", asyncHandler(aiController.generateTemplateDraft));
