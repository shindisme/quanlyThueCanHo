import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreateOccupantRequest,
    CreateTenantRequest,
    ListMyOccupantsRequest,
    ListTenantsRequest,
    MyTenantProfileRequest,
    OccupantIdRequest,
    TenantIdRequest,
    UpdateOccupantRequest,
    UpdateTenantRequest,
    UpdateMyTenantProfileRequest
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

export const getMyOccupants = async (
    request: Request,
    response: Response
) => {
    getValidated<ListMyOccupantsRequest>(request);
    const occupants = await tenantService.getMyOccupants(
        request.actor!
    );

    return sendSuccess(response, occupants);
};

export const createMyOccupant = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateOccupantRequest>(request);
    const occupant = await tenantService.createMyOccupant(
        body,
        request.actor!
    );

    return sendSuccess(response, occupant, 201);
};

export const updateMyOccupant = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateOccupantRequest>(request);
    const occupant = await tenantService.updateMyOccupant(
        params.occupantId,
        body,
        request.actor!
    );

    return sendSuccess(response, occupant);
};

export const deleteMyOccupant = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<OccupantIdRequest>(request);
    const result = await tenantService.deleteMyOccupant(
        params.occupantId,
        request.actor!
    );

    return sendSuccess(response, result);
};

export const getMyProfile = async (
    request: Request,
    response: Response
) => {
    getValidated<MyTenantProfileRequest>(request);
    const tenant = await tenantService.getMyTenantProfile(request.actor!);
    return sendSuccess(response, tenant);
};

export const updateMyProfile = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<UpdateMyTenantProfileRequest>(request);
    const tenant = await tenantService.updateMyTenantProfile(body, request.actor!);
    return sendSuccess(response, tenant);
};
