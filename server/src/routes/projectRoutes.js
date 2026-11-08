import { Router } from "express";
import * as projects from "../controllers/projectController.js";
import { checkOrigin } from "../middleware/checkOrigin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(checkOrigin);
router.use(requireAuth);
router.get("/", projects.list);
router.post("/", projects.create);
router.patch("/:id", projects.update);
router.delete("/:id", projects.remove);
export default router;
