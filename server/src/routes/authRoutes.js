import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { checkOrigin } from "../middleware/checkOrigin.js";

const router = Router();

router.post("/register", checkOrigin, authController.register);
router.post("/login", checkOrigin, authController.login);
router.post("/logout", checkOrigin, authController.logout);
router.get("/me", authController.me);

export default router;
