import type { Request } from "express";

export const getClientIp = (request: Request) =>
    request.ip || request.socket.remoteAddress || "";
