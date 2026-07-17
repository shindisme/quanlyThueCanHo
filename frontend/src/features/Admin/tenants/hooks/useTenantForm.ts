import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantSchema, type TenantFormValues } from "../../../../schemas/tenant.schema";

export function useTenantForm(defaultValues?: Partial<TenantFormValues>) {
  return useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      full_name: "",
      citizen_id: "",
      date_of_birth: "",
      address: "",
      email: "",
      phone: "",
      ...defaultValues,
    },
  });
}
