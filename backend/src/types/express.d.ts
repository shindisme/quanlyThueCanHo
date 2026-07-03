declare namespace Express {
    interface Request {
        actor?: import("./auth.js").Actor;
        validated?: unknown;
    }
}
