import { Router } from "express";
import * as taskController from "../controllers/taskController.js";
import { checkOrigin } from "../middleware/checkOrigin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(checkOrigin);
router.use(requireAuth);
router.get("/", taskController.list);
router.post("/", taskController.create);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.remove);

export default router;
