import { Router } from "express";
import * as templateController from "../controllers/templateController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const templateRouter = Router();

templateRouter.get("/templates", asyncHandler(templateController.listTemplates));
templateRouter.post("/templates/status", asyncHandler(templateController.updateTemplatesStatus));
templateRouter.get("/templates/:id", asyncHandler(templateController.getTemplate));
templateRouter.post("/templates/:id/design-log", asyncHandler(templateController.recordDesignLog));
templateRouter.post("/templates", asyncHandler(templateController.createTemplate));
templateRouter.patch("/templates/:id/name", asyncHandler(templateController.updateTemplateName));
templateRouter.put("/templates/:id", asyncHandler(templateController.updateTemplate));
templateRouter.post("/templates/:id/enable", asyncHandler(templateController.enableTemplate));
templateRouter.post("/templates/:id/disable", asyncHandler(templateController.disableTemplate));
templateRouter.post("/templates/:id/copy", asyncHandler(templateController.copyTemplate));
templateRouter.delete("/templates/:id", asyncHandler(templateController.deleteTemplate));
