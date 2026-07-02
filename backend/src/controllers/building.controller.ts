import type {
    Request,
    Response
} from "express";
import { AppError } from "../errors/app-error.js";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    BuildingIdRequest,
    CreateBuildingRequest,
    ListBuildingsRequest,
    UpdateBuildingRequest
} from "../schemas/building.schema.js";
import * as buildingService from "../services/building.service.js";
import { withCompensatedImageUploads } from "../services/image-upload.service.js";
import { assertUpdateHasChanges } from "../services/update-validation.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

const withDisplayName = <
    T extends { branch_name: string }
>(building: T) => ({
    ...building,
    name: building.branch_name
});

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateBuildingRequest>(request);
    const building = await withCompensatedImageUploads(
        request.file ? [request.file] : [],
        "/buildings",
        async (images) => buildingService.createBuildingService(
            body,
            images[0]?.url
        )
    );

    return sendSuccess(response, withDisplayName(building), 201);
};

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListBuildingsRequest>(request);
    const result = await buildingService.getAllBuildingsService({
        search: query.search,
        branch_name: query.branch_name,
        page: query.page,
        limit: query.limit,
        staffId: query.staff
    });

    return sendPaginated(
        response,
        result.data.map(withDisplayName),
        result.pagination
    );
};

export const getById = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<BuildingIdRequest>(request);
    const building = await buildingService.getBuildingByIdService(
        params.id
    );

    if (!building) {
        throw new AppError(
            404,
            "NOT_FOUND",
            "Building was not found"
        );
    }

    return sendSuccess(response, withDisplayName(building));
};

export const update = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateBuildingRequest>(request);
    assertUpdateHasChanges(body, request.file !== undefined);

    buildingService.assertBuildingUpdateAccessService(
        params.id,
        body,
        request.actor!
    );

    const building = await withCompensatedImageUploads(
        request.file ? [request.file] : [],
        "/buildings",
        async (images) => buildingService.updateBuildingService(
            params.id,
            body,
            request.actor!,
            images[0]?.url
        )
    );

    return sendSuccess(response, withDisplayName(building));
};

export const remove = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<BuildingIdRequest>(request);

    await buildingService.deleteBuildingService(params.id);
    return sendSuccess(response, { deleted: true });
};
