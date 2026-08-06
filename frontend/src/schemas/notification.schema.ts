import { z } from "zod";

export const broadcastNotificationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Tiêu đề thông báo phải có ít nhất 5 ký tự")
      .max(100, "Tiêu đề không được vượt quá 100 ký tự"),
    content: z
      .string()
      .trim()
      .min(10, "Nội dung thông báo phải có ít nhất 10 ký tự")
      .max(2000, "Nội dung không được vượt quá 2000 ký tự"),
    type: z.enum(["GENERAL", "INVOICE", "MAINTENANCE", "SYSTEM"]).default("GENERAL"),
    target_type: z.enum(["BUILDING", "APARTMENTS"]),
    building_id: z.number().positive("Vui lòng chọn tòa nhà"),
    apartment_ids: z.array(z.number()).optional(),
  })
  .refine(
    (data) => {
      if (data.target_type === "APARTMENTS") {
        return Array.isArray(data.apartment_ids) && data.apartment_ids.length > 0;
      }
      return true;
    },
    {
      message: "Vui lòng chọn ít nhất một căn hộ nhận thông báo",
      path: ["apartment_ids"],
    }
  );

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
