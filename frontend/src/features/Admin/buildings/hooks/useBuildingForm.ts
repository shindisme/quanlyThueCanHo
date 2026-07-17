import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  buildingSchema,
  buildingModifySchema,
  type BuildingFormValues,
  type BuildingModifyFormValues,
} from "../../../../schemas/building.schema";

export function useCreateBuildingForm() {
  return useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      branch_name: "",
      address_old: "",
      address_new: "",
      total_floors: 0,
      staff_id: null,
      description: "",
    },
  });
}

export function useUpdateBuildingForm(defaultValues: BuildingModifyFormValues) {
  return useForm<BuildingModifyFormValues>({
    resolver: zodResolver(buildingModifySchema),
    defaultValues,
  });
}
