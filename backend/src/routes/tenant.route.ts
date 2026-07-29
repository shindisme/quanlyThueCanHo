import { Role } from "@prisma/client";
import { Router } from "express";
import * as tenantController from "../controllers/tenant.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createOccupantRequestSchema,
    createTenantRequestSchema,
    listMyOccupantsRequestSchema,
    listTenantsRequestSchema,
    occupantIdRequestSchema,
    tenantIdRequestSchema,
    updateOccupantRequestSchema,
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
const authorizeTenantOccupants = authorizeRole([Role.TENANT]);

router.use(authenticate);
router.get(
    "/",
    authorizeTenantManagement,
    validate(listTenantsRequestSchema),
    tenantController.getAll
);
router.get(
    "/me/occupants",
    authorizeTenantOccupants,
    validate(listMyOccupantsRequestSchema),
    tenantController.getMyOccupants
);
router.post(
    "/me/occupants",
    authorizeTenantOccupants,
    validate(createOccupantRequestSchema),
    tenantController.createMyOccupant
);
router.put(
    "/me/occupants/:occupantId",
    authorizeTenantOccupants,
    validate(updateOccupantRequestSchema),
    tenantController.updateMyOccupant
);
router.delete(
    "/me/occupants/:occupantId",
    authorizeTenantOccupants,
    validate(occupantIdRequestSchema),
    tenantController.deleteMyOccupant
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