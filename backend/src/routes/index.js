import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { businessDataRouter } from "./businessData.routes.js";
import { businessModuleRouter } from "./businessModule.routes.js";
import { fieldRouter } from "./field.routes.js";
import { healthRouter } from "./health.routes.js";
import { menuRouter } from "./menu.routes.js";
import { printRouter } from "./print.routes.js";
import { roleRouter } from "./role.routes.js";
import { templateRouter } from "./template.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use(healthRouter);
apiRouter.use(templateRouter);
apiRouter.use(businessModuleRouter);
apiRouter.use(fieldRouter);
apiRouter.use(printRouter);
apiRouter.use(businessDataRouter);
apiRouter.use(userRouter);
apiRouter.use(roleRouter);
apiRouter.use(menuRouter);
