import { z } from "zod";

export const VIETNAM_PHONE_REGEX = /^0[1-9]\d{8}$/;
export const CITIZEN_ID_REGEX = /^\d{12}$/;

export const requiredPhoneSchema = z
  .string()
  .trim()
  .min(1, { message: "Vui lòng nhập số điện thoại" })
  .regex(VIETNAM_PHONE_REGEX, { message: "Số điện thoại không hợp lệ" });

export const optionalPhoneSchema = z
  .string()
  .trim()
  .regex(VIETNAM_PHONE_REGEX, { message: "Số điện thoại không hợp lệ" })
  .or(z.literal(""))
  .nullable()
  .optional();

export const citizenIdSchema = z
  .string()
  .trim()
  .min(1, { message: "Vui lòng nhập số CCCD" })
  .regex(CITIZEN_ID_REGEX, {
    message: "CCCD không hợp lệ (phải gồm đúng 12 chữ số)",
  });

export const optionalEmailSchema = z
  .string()
  .trim()
  .email({ message: "Email không hợp lệ" })
  .max(320, { message: "Email tối đa 320 ký tự" })
  .or(z.literal(""))
  .nullable()
  .optional();
