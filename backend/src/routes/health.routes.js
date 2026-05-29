import { Router } from "express";
import * as healthController from "../controllers/healthController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(healthController.health));
