import { Router, type IRouter } from "express";
import healthRouter from "./health";
import operoRouter from "./opero";

const router: IRouter = Router();

router.use(healthRouter);
router.use(operoRouter);

export default router;
