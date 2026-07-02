import { Role } from "@prisma/client";
import { Router } from "express";
import {
    create,
    end,
    extend,
    getAll,
    getById
} from "../controllers/contract.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    contractIdRequestSchema,
    createContractRequestSchema,
    endContractRequestSchema,
    extendContractRequestSchema,
    listContractsRequestSchema
} from "../schemas/contract.schema.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.TENANT]),
    validate(listContractsRequestSchema),
    getAll
);
router.post(
    "/",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(createContractRequestSchema),
    create
);
router.patch(
    "/:id/extend",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(extendContractRequestSchema),
    extend
);
router.patch(
    "/:id/end",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(endContractRequestSchema),
    end
);
router.get(
    "/:id",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.TENANT]),
    validate(contractIdRequestSchema),
    getById
);

export default router;
