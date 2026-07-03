declare global {
    namespace Express {
        interface Request {
            actor?: import("../../services/auth.service.js").Actor;
            validated?: unknown;
        }
    }
}

export {};
