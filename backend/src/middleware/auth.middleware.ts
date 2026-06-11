import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Mở rộng Request để thêm user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// Middleware xác thực token
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ message: "Yêu cầu đăng nhập để truy cập!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

// Middleware phân quyền
export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này!" });
        }
        next();
    };
};