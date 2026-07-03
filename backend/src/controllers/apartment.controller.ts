import type {
    Request,
    Response
} from "express";
import { AppError } from "../errors/app-error.js";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ApartmentIdRequest,
    CreateApartmentRequest,
    ListApartmentsRequest,
    UpdateApartmentRequest
} from "../schemas/apartment.schema.js";
import * as apartmentService from "../services/apartment.service.js";
import { withCompensatedImageUploads } from "../services/image-upload.service.js";
import { assertUpdateHasChanges } from "../services/update-validation.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateApartmentRequest>(request);

    apartmentService.assertApartmentCreateAccessService(
        request.actor!,
        body.building_id
    );

    const files =
        (request.files as Express.Multer.File[] | undefined) ?? [];
    const apartment = await withCompensatedImageUploads(
        files,
        "/apartments",
        async (images) =>
            apartmentService.createApartmentWithImagesService(
                body,
                images.map(({ url }) => url),
                request.actor!
            )
    );

    return sendSuccess(response, apartment, 201);
};

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListApartmentsRequest>(request);
    const result = await apartmentService.getAllApartmentsService(query);

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
    const { params } = getValidated<ApartmentIdRequest>(request);
    const apartment = await apartmentService.getApartmentByIdService(
        params.id
    );

    if (!apartment) {
        throw new AppError(
            404,
            "NOT_FOUND",
            "Apartment was not found"
        );
    }

    return sendSuccess(response, apartment);
};

export const update = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateApartmentRequest>(request);
    const files =
        (request.files as Express.Multer.File[] | undefined) ?? [];
    assertUpdateHasChanges(body, files.length > 0);

    if (files.length > 0) {
        await apartmentService.assertApartmentUpdateAccessService(
            params.id,
            request.actor!
        );
    }

    const apartment = await withCompensatedImageUploads(
        files,
        "/apartments",
        async (images) => apartmentService.updateApartmentService(
            params.id,
            body,
            images.map(({ url }) => url),
            request.actor!
        )
    );

    return sendSuccess(response, apartment);
};

export const remove = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<ApartmentIdRequest>(request);

    await apartmentService.deleteApartmentService(
        params.id,
        request.actor!
    );
    return sendSuccess(response, { deleted: true });
};
