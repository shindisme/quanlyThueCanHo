import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffSchema, type StaffFormValues } from "../../../../schemas/staff.schema";

export function useStaffForm(defaultValues?: Partial<StaffFormValues>) {
  return useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      position: "Quản lý",
      buildingId: null,
      ...defaultValues,
    },
  });
}
