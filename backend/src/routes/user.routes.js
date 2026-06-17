import { Router } from "express";
import * as ctrl from "../controllers/userController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const userRouter = Router();
userRouter.get("/users", asyncHandler(ctrl.list));
userRouter.post("/users", asyncHandler(ctrl.create));
userRouter.put("/users/:id", asyncHandler(ctrl.update));
userRouter.delete("/users/:id", asyncHandler(ctrl.remove));
userRouter.put("/users/:id/password", asyncHandler(ctrl.changePassword));
