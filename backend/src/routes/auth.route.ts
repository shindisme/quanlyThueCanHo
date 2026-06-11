import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", authController.login);
router.post("/change-password", authController.changePassword);

router.post("/admin/create-user", authenticate, authorizeRole(["ADMIN"]), authController.createAccount);
router.delete("/admin/delete-user/:id", authenticate, authorizeRole(["ADMIN"]), authController.deleteUser);
router.get("/admin/users", authenticate, authorizeRole(["ADMIN"]), authController.getAllUsers);
router.put("/admin/users/:id", authenticate, authorizeRole(["ADMIN"]), authController.updateUserInfo);
router.post("/admin/reset-password/:id", authenticate, authorizeRole(["ADMIN"]), authController.resetPassword);

export default router;