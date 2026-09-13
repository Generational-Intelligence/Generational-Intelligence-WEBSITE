import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generationalIntelligenceRouter from "./generational-intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generationalIntelligenceRouter);

export default router;
