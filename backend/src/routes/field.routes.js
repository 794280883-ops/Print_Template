import { Router } from "express";
import * as fieldController from "../controllers/fieldController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const fieldRouter = Router();

fieldRouter.get("/template/fields/:moduleCode", requirePermission(["field:view", "template:view"]), asyncHandler(fieldController.listFields));
