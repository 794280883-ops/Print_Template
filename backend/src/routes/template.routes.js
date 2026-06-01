import { Router } from "express";
import * as templateController from "../controllers/templateController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const templateRouter = Router();

templateRouter.get("/templates", asyncHandler(templateController.listTemplates));
templateRouter.get("/templates/operation-logs", asyncHandler(templateController.listOperationLogs));
templateRouter.get("/templates/:id", asyncHandler(templateController.getTemplate));
templateRouter.post("/templates/:id/design-log", asyncHandler(templateController.recordDesignLog));
templateRouter.post("/templates", asyncHandler(templateController.createTemplate));
templateRouter.patch("/templates/:id/name", asyncHandler(templateController.updateTemplateName));
templateRouter.put("/templates/:id", asyncHandler(templateController.updateTemplate));
templateRouter.post("/templates/:id/publish", asyncHandler(templateController.publishTemplate));
templateRouter.post("/templates/:id/disable", asyncHandler(templateController.disableTemplate));
templateRouter.post("/templates/:id/copy", asyncHandler(templateController.copyTemplate));
templateRouter.post("/templates/import", asyncHandler(templateController.importTemplate));
templateRouter.get("/templates/:id/export", asyncHandler(templateController.exportTemplate));
templateRouter.delete("/templates/:id", asyncHandler(templateController.deleteTemplate));
