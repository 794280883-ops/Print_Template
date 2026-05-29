import { Router } from "express";
import * as fieldController from "../controllers/fieldController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const fieldRouter = Router();

fieldRouter.get("/template/fields/:templateType", asyncHandler(fieldController.listFields));
