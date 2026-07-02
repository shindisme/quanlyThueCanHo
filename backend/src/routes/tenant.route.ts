import { Role } from "@prisma/client";
import { Router } from "express";
import * as tenantController from "../controllers/tenant.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createTenantRequestSchema,
    listTenantsRequestSchema,
    tenantIdRequestSchema,
    updateTenantRequestSchema
} from "../schemas/tenant.schema.js";

const router = Router();
const authorizeTenantManagement = authorizeRole([
    Role.ADMIN,
    Role.MANAGER
]);
const authorizeTenantDetail = authorizeRole([
    Role.ADMIN,
    Role.MANAGER,
    Role.TENANT
]);

router.use(authenticate);
router.get(
    "/",
    authorizeTenantManagement,
    validate(listTenantsRequestSchema),
    tenantController.getAll
);
router.get(
    "/:id",
    authorizeTenantDetail,
    validate(tenantIdRequestSchema),
    tenantController.getById
);
router.post(
    "/",
    authorizeTenantManagement,
    validate(createTenantRequestSchema),
    tenantController.create
);
router.put(
    "/:id",
    authorizeTenantManagement,
    validate(updateTenantRequestSchema),
    tenantController.update
);
router.delete(
    "/:id",
    authorizeTenantManagement,
    validate(tenantIdRequestSchema),
    tenantController.remove
);

export default router;
