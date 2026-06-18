import { Router } from "express";
import * as templateController from "../controllers/templateController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const templateRouter = Router();

templateRouter.get("/templates", requirePermission("template:view"), asyncHandler(templateController.listTemplates));
templateRouter.post("/templates/status", requirePermission((req) => req.body?.status === "enabled" ? "template:enable" : "template:disable"), asyncHandler(templateController.updateTemplatesStatus));
templateRouter.get("/templates/:id", requirePermission("template:view"), asyncHandler(templateController.getTemplate));
templateRouter.post("/templates/:id/design-log", requirePermission("template:view"), asyncHandler(templateController.recordDesignLog));
templateRouter.post("/templates", requirePermission("template:create"), asyncHandler(templateController.createTemplate));
templateRouter.patch("/templates/:id/name", requirePermission("template:edit"), asyncHandler(templateController.updateTemplateName));
templateRouter.put("/templates/:id", requirePermission("template:edit"), asyncHandler(templateController.updateTemplate));
templateRouter.post("/templates/:id/enable", requirePermission("template:enable"), asyncHandler(templateController.enableTemplate));
templateRouter.post("/templates/:id/disable", requirePermission("template:disable"), asyncHandler(templateController.disableTemplate));
templateRouter.post("/templates/:id/copy", requirePermission("template:create"), asyncHandler(templateController.copyTemplate));
templateRouter.delete("/templates/:id", requirePermission("template:delete"), asyncHandler(templateController.deleteTemplate));
