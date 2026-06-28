import { Role } from "@prisma/client";
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    changePasswordRequestSchema,
    createUserRequestSchema,
    emptyAuthRequestSchema,
    loginRequestSchema,
    updateUserRequestSchema,
    userIdRequestSchema
} from "../schemas/auth.schema.js";

const router = Router();
const userManagerRoles = [Role.ADMIN, Role.MANAGER];

router.post(
    "/login",
    validate(loginRequestSchema),
    authController.login
);
router.post(
    "/change-password",
    authenticate,
    validate(changePasswordRequestSchema),
    authController.changePassword
);
router.post(
    "/create-user",
    authenticate,
    authorizeRole(userManagerRoles),
    validate(createUserRequestSchema),
    authController.createAccount
);
router.delete(
    "/delete-user/:id",
    authenticate,
    authorizeRole(userManagerRoles),
    validate(userIdRequestSchema),
    authController.deleteUser
);
router.get(
    "/users",
    authenticate,
    authorizeRole(userManagerRoles),
    validate(emptyAuthRequestSchema),
    authController.getAllUsers
);
router.put(
    "/users/:id",
    authenticate,
    authorizeRole(userManagerRoles),
    validate(updateUserRequestSchema),
    authController.updateUserInfo
);
router.post(
    "/reset-password/:id",
    authenticate,
    authorizeRole(userManagerRoles),
    validate(userIdRequestSchema),
    authController.resetPassword
);

export default router;
