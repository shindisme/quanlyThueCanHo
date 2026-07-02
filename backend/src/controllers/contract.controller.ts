import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ContractIdRequest,
    CreateContractRequest,
    EndContractRequest,
    ExtendContractRequest,
    ListContractsRequest
} from "../schemas/contract.schema.js";
import * as contractService from "../services/contract.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListContractsRequest>(request);
    const result = await contractService.getContractsService(
        query,
        request.actor!
    );

    return sendPaginated(
        response,
        result.data,
        result.pagination
    );
};

export const getById = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<ContractIdRequest>(request);
    const contract = await contractService.getContractByIdService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, contract);
};

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateContractRequest>(request);
    const contract = await contractService.createContractService(
        body,
        request.actor!
    );

    return sendSuccess(response, contract, 201);
};

export const extend = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<ExtendContractRequest>(request);
    const result = await contractService.extendContractService(
        params.id,
        body.new_end_date,
        request.actor!
    );

    return sendSuccess(response, {
        id: result.contract.id,
        old_end_date: result.old_end_date,
        new_end_date: result.contract.end_date,
        extended_at: result.contract.extended_at
    });
};

export const end = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<EndContractRequest>(request);
    const result = await contractService.endContractService(
        params.id,
        request.actor!,
        body.end_date
    );

    return sendSuccess(response, result);
};
