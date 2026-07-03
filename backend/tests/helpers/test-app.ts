import express, { type Router } from "express";
import {
    errorHandler,
    notFound
} from "../../src/middleware/error.middleware.js";

export const createTestApp = (router: Router, mountPath = "/") => {
    const app = express();

    app.use(express.json());
    app.use(mountPath, router);
    app.use(notFound);
    app.use(errorHandler);

    return app;
};
