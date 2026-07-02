import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreateTenantRequest,
    ListTenantsRequest,
    TenantIdRequest,
    UpdateTenantRequest
} from "../schemas/tenant.schema.js";
import * as tenantService from "../services/tenant.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateTenantRequest>(request);
    const tenant = await tenantService.createTenant(
        body,
        request.actor!
    );

    return sendSuccess(response, tenant, 201);
};

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListTenantsRequest>(request);
    const result = await tenantService.getTenants(
        query.page,
        query.limit,
        query.search,
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
    const { params } = getValidated<TenantIdRequest>(request);
    const tenant = await tenantService.getTenantById(
        params.id,
        request.actor!
    );

    return sendSuccess(response, tenant);
};

export const update = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateTenantRequest>(request);
    const tenant = await tenantService.updateTenant(
        params.id,
        body,
        request.actor!
    );

    return sendSuccess(response, tenant);
};

export const remove = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<TenantIdRequest>(request);

    await tenantService.deleteTenant(params.id, request.actor!);
    return sendSuccess(response, { deleted: true });
};
