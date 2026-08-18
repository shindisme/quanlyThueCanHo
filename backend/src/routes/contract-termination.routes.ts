import { Role } from "@prisma/client";
import { Router } from "express";
import * as controller from "../controllers/contract-termination.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    approveTerminationRequestSchema,
    completeHandoverRequestSchema,
    createManagerTerminationRequestSchema,
    createOverdueTerminationRequestSchema,
    createTenantTerminationRequestSchema,
    listContractTerminationsRequestSchema,
    overdueCandidatesRequestSchema,
    previewSettlementRequestSchema,
    rejectTerminationRequestSchema,
    terminationIdRequestSchema,
    updateInspectionRequestSchema
} from "../schemas/contract-termination.schema.js";

const router = Router();
const managerRoles = [Role.ADMIN, Role.MANAGER];

router.use(authenticate);

router.get(
    "/",
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.TENANT]),
    validate(listContractTerminationsRequestSchema),
    controller.getAll
);
router.post(
    "/",
    authorizeRole([Role.TENANT]),
    validate(createTenantTerminationRequestSchema),
    controller.createTenantRequest
);
router.post(
    "/manager",
    authorizeRole(managerRoles),
    validate(createManagerTerminationRequestSchema),
    controller.createManager
);
router.get(
    "/overdue-candidates",
    authorizeRole(managerRoles),
    validate(overdueCandidatesRequestSchema),
    controller.getOverdueCandidates
);
router.post(
    "/overdue",
    authorizeRole(managerRoles),
    validate(createOverdueTerminationRequestSchema),
    controller.createOverdue
);
router.patch(
    "/:id/approve",
    authorizeRole(managerRoles),
    validate(approveTerminationRequestSchema),
    controller.approve
);
router.patch(
    "/:id/reject",
    authorizeRole(managerRoles),
    validate(rejectTerminationRequestSchema),
    controller.reject
);
router.patch(
    "/:id/cancel",
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.TENANT]),
    validate(terminationIdRequestSchema),
    controller.cancel
);
router.patch(
    "/:id/start-inspection",
    authorizeRole(managerRoles),
    validate(terminationIdRequestSchema),
    controller.startInspection
);
router.put(
    "/:id/inspection",
    authorizeRole(managerRoles),
    validate(updateInspectionRequestSchema),
    controller.updateInspection
);
router.post(
    "/:id/settlement-preview",
    authorizeRole(managerRoles),
    validate(previewSettlementRequestSchema),
    controller.previewSettlement
);
router.patch(
    "/:id/complete",
    authorizeRole(managerRoles),
    validate(completeHandoverRequestSchema),
    controller.completeHandover
);

export default router;