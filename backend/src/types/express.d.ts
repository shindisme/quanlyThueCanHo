import type { Actor } from "./auth.js";

declare global {
    namespace Express {
        interface Request {
            actor?: Actor;
            validated?: unknown;
        }
    }
}

export {};
