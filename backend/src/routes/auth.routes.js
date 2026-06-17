import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const authRouter = Router();
authRouter.post("/auth/login", asyncHandler(authController.login));
