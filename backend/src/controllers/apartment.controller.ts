import { imagekit } from "@/config/imagekit.js";
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
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

const uploadImages = async (files: Express.Multer.File[]) => {
    const results = await Promise.all(files.map((file) =>
        imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: `${Date.now()}_${file.originalname}`,
            folder: "/apartments"
        })
    ));

    return results.map((result) => result.url);
};

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateApartmentRequest>(request);

    apartmentService.assertApartmentCreateAccessService(
        request.actor!,
        body.building_id
    );

    const imageUrls = await uploadImages(
        (request.files as Express.Multer.File[] | undefined) ?? []
    );
    const apartment =
        await apartmentService.createApartmentWithImagesService(
            body,
            imageUrls,
            request.actor!
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

    if (files.length > 0) {
        await apartmentService.assertApartmentUpdateAccessService(
            params.id,
            request.actor!
        );
    }

    const imageUrls = await uploadImages(files);
    const apartment = await apartmentService.updateApartmentService(
        params.id,
        body,
        imageUrls,
        request.actor!
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
