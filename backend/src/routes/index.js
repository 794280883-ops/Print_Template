import { Router } from "express";
import { aiRouter } from "./ai.routes.js";
import { fieldRouter } from "./field.routes.js";
import { healthRouter } from "./health.routes.js";
import { printRouter } from "./print.routes.js";
import { templateRouter } from "./template.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(templateRouter);
apiRouter.use(fieldRouter);
apiRouter.use(printRouter);
apiRouter.use(aiRouter);
