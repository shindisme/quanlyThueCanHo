import { Role } from "@prisma/client";
import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createPaymentRequestSchema,
    createVnpayPaymentRequestSchema,
    listPaymentsRequestSchema,
    paymentIdRequestSchema,
    paymentMethodsRequestSchema,
    updatePaymentStatusRequestSchema
} from "../schemas/payment.schema.js";

const router = Router();

router.get(
    "/vnpay/return",
    paymentController.vnpayReturn
);

router.get(
    "/vnpay/ipn",
    paymentController.vnpayIpn
);

router.use(authenticate);

const paymentRoles = [
    Role.ADMIN,
    Role.MANAGER,
    Role.TENANT
];

router.post(
    "/vnpay/create",
    authorizeRole([Role.TENANT]),
    validate(createVnpayPaymentRequestSchema),
    paymentController.createVnpayPayment
);

router.get(
    "/",
    authorizeRole(paymentRoles),
    validate(listPaymentsRequestSchema),
    paymentController.getAll
);

router.post(
    "/",
    authorizeRole(paymentRoles),
    validate(createPaymentRequestSchema),
    paymentController.create
);

router.get(
    "/methods",
    authorizeRole(paymentRoles),
    validate(paymentMethodsRequestSchema),
    paymentController.getMethods
);

router.get(
    "/:id",
    authorizeRole(paymentRoles),
    validate(paymentIdRequestSchema),
    paymentController.getById
);

router.patch(
    "/:id/status",
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(updatePaymentStatusRequestSchema),
    paymentController.updateStatus
);

export default router;
