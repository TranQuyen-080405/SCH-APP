import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController.js";
import { checkOrigin } from "../middleware/checkOrigin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(checkOrigin);
router.use(requireAuth);
router.get("/", dashboardController.show);

export default router;
