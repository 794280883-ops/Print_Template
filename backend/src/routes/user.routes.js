import { Router } from "express";
import * as ctrl from "../controllers/userController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requirePermission } from "../middlewares/auth.js";

export const userRouter = Router();
userRouter.get("/users", requirePermission("system:user:view"), asyncHandler(ctrl.list));
userRouter.post("/users", requirePermission("system:user:create"), asyncHandler(ctrl.create));
userRouter.put("/users/:id", requirePermission("system:user:edit"), asyncHandler(ctrl.update));
userRouter.delete("/users/:id", requirePermission("system:user:delete"), asyncHandler(ctrl.remove));
userRouter.put("/users/:id/password", requirePermission("system:user:password"), asyncHandler(ctrl.changePassword));
