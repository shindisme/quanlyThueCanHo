import {
    Role
} from "@prisma/client";
import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    generateMonthlyInvoicesRequestSchema,
    invoiceIdRequestSchema,
    listInvoicesRequestSchema,
    updateInvoiceStatusRequestSchema
} from "../schemas/invoice.schema.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorizeRole([
        Role.ADMIN,
        Role.MANAGER,
        Role.TENANT
    ]),
    validate(listInvoicesRequestSchema),
    invoiceController.getAll
);
router.post(
    "/generate-monthly",
    authenticate,
    authorizeRole([
        Role.ADMIN,
        Role.MANAGER
    ]),
    validate(generateMonthlyInvoicesRequestSchema),
    invoiceController.generateMonthly
);
router.get(
    "/:id",
    authenticate,
    authorizeRole([
        Role.ADMIN,
        Role.MANAGER,
        Role.TENANT
    ]),
    validate(invoiceIdRequestSchema),
    invoiceController.getById
);
router.patch(
    "/:id/status",
    authenticate,
    authorizeRole([
        Role.ADMIN,
        Role.MANAGER
    ]),
    validate(updateInvoiceStatusRequestSchema),
    invoiceController.updateStatus
);

export default router;
