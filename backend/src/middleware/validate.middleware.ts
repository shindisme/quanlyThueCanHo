import type {
    NextFunction,
    Request,
    Response
} from "express";
import type { ZodType } from "zod";

export const validate = <T>(schema: ZodType<T>) => {
    return async (
        request: Request,
        _response: Response,
        next: NextFunction
    ) => {
        try {
            request.validated = await schema.parseAsync({
                params: request.params,
                query: request.query,
                body: request.body
            });
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const getValidated = <T>(request: Request) => {
    return request.validated as T;
};
