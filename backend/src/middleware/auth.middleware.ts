import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export interface JwtPayload {
    id: number;
    userId?: number;
    role: string;
    username?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload; 
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        res.status(401).json({ message: "Yêu cầu đăng nhập để truy cập!" });
        return; 
    }

    if (!process.env.JWT_SECRET) {
        console.error("CRITICAL ERROR: Chưa cấu hình JWT_SECRET trong file .env");
        res.status(500).json({ message: "Lỗi máy chủ nội bộ!" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        if (!decoded.id && decoded.userId) {
            decoded.id = decoded.userId;
        }
        req.user = decoded;
        
        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!" });
            return;
        }
        res.status(403).json({ message: "Token không hợp lệ!" });
        return;
    }
};

export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này!" });
            return;
        }
        next();
    };
};
