import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";

export const createAccount = async (req: Request, res: Response) => {
    try {
        const user = await authService.createAccountByAdminService(req.body);
        res.status(201).json({ message: "Tài khoản đã được tạo thành công", userId: user.id });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginService(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await authService.deleteUserService(Number(id));
        res.json({ message: "Đã xóa người dùng thành công" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await authService.getAllUsersService();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const updateUserInfo = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await authService.updateUserService(Number(id), req.body);
    res.json({ message: "Cập nhật thành công", user });
};

export const resetPassword = async (req: Request, res: Response) => {
    await authService.resetPasswordByAdminService(Number(req.params.id));
    res.json({ message: "Mật khẩu đã reset về 123456" });
};

export const changePassword = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    await authService.changePasswordService(userId, req.body.oldPass, req.body.newPass);
    res.json({ message: "Đổi mật khẩu thành công" });
};