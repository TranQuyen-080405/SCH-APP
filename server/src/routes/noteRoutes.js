import { Router } from "express";
import * as noteController from "../controllers/noteController.js";
import { checkOrigin } from "../middleware/checkOrigin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(checkOrigin);
router.use(requireAuth);
router.get("/", noteController.list);
router.post("/", noteController.create);
router.get("/:id", noteController.show);
router.patch("/:id", noteController.update);
router.delete("/:id", noteController.remove);

export default router;
