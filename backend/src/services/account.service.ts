import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";

export const createInitialCredential = async () => {
    const initial_password = "123123";
    const password_hash = await bcrypt.hash(initial_password, 10);
    return {
        initial_password,
        password_hash
    };
};

export const tenantUsername = (citizenId: string) => {
    const normalized = citizenId.replace(/\D/g, "");
    return `YH${normalized.slice(-6)}`;
};

export const nextStaffUsername = (
    prefix: "quanly" | "nhanvien",
    usernames: string[]
) => {
    const indices = usernames.map((username) => {
        const match = username.match(
            new RegExp(`^${prefix}(\\d+)$`)
        );
        return match ? Number(match[1]) : 0;
    });

    return `${prefix}${Math.max(0, ...indices) + 1}`;
};
