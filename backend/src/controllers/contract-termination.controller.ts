import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ApproveTerminationRequest,
    CompleteHandoverRequest,
    CreateOverdueTerminationRequest,
    CreateTenantTerminationRequest,
    ListContractTerminationsRequest,
    PreviewSettlementRequest,
    RejectTerminationRequest,
    TerminationIdRequest,
    UpdateInspectionRequest
} from "../schemas/contract-termination.schema.js";
import * as terminationService from "../services/contract-termination.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ListContractTerminationsRequest>(request);
    const result =
        await terminationService.getContractTerminationsService(
            query,
            request.actor!
        );

    return sendPaginated(response, result.data, result.pagination);
};

export const createTenantRequest = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateTenantTerminationRequest>(request);
    const termination =
        await terminationService.createTenantTerminationService(
            body,
            request.actor!
        );

    return sendSuccess(response, termination, 201);
};

export const approve = async (
    request: Request,
    response: Response
) => {
    const { params, body } =
        getValidated<ApproveTerminationRequest>(request);
    const termination = await terminationService.approveTerminationService(
        params.id,
        body,
        request.actor!
    );

    return sendSuccess(response, termination);
};

export const reject = async (
    request: Request,
    response: Response
) => {
    const { params, body } =
        getValidated<RejectTerminationRequest>(request);
    const termination = await terminationService.rejectTerminationService(
        params.id,
        body.rejected_reason,
        request.actor!
    );

    return sendSuccess(response, termination);
};

export const cancel = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<TerminationIdRequest>(request);
    const termination = await terminationService.cancelTerminationService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, termination);
};

export const getOverdueCandidates = async (
    request: Request,
    response: Response
) => {
    const candidates =
        await terminationService.getOverdueCandidatesService(
            request.actor!
        );

    return sendSuccess(response, candidates);
};

export const createOverdue = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateOverdueTerminationRequest>(request);
    const termination =
        await terminationService.createOverdueTerminationService(
            body,
            request.actor!
        );

    return sendSuccess(response, termination, 201);
};

export const startInspection = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<TerminationIdRequest>(request);
    const termination = await terminationService.startInspectionService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, termination);
};

export const updateInspection = async (
    request: Request,
    response: Response
) => {
    const { params, body } =
        getValidated<UpdateInspectionRequest>(request);
    const termination = await terminationService.updateInspectionService(
        params.id,
        body,
        request.actor!
    );

    return sendSuccess(response, termination);
};

export const previewSettlement = async (
    request: Request,
    response: Response
) => {
    const { params, body } =
        getValidated<PreviewSettlementRequest>(request);
    const settlement = await terminationService.previewSettlementService(
        params.id,
        body,
        request.actor!
    );

    return sendSuccess(response, settlement);
};

export const completeHandover = async (
    request: Request,
    response: Response
) => {
    const { params, body } =
        getValidated<CompleteHandoverRequest>(request);
    const result = await terminationService.completeHandoverService(
        params.id,
        body,
        request.actor!
    );

    return sendSuccess(response, result);
};
