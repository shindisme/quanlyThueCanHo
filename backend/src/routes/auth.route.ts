import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", authController.login);
router.post("/change-password", authenticate, authController.changePassword);

router.post("/create-user", authenticate, authorizeRole(["ADMIN", "MANAGER"]), authController.createAccount);
router.delete("/delete-user/:id", authenticate, authorizeRole(["ADMIN", "MANAGER"]), authController.deleteUser);
router.get("/users", authenticate, authorizeRole(["ADMIN", "MANAGER"]), authController.getAllUsers);
router.put("/users/:id", authenticate, authorizeRole(["ADMIN", "MANAGER"]), authController.updateUserInfo);
router.post("/reset-password/:id", authenticate, authorizeRole(["ADMIN", "MANAGER"]), authController.resetPassword);

export default router;