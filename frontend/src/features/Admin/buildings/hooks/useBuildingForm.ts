import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  buildingSchema,
  buildingModifySchema,
  DEFAULT_BUILDING_FORM,
  type BuildingFormValues,
  type BuildingModifyFormValues,
} from "../../../../schemas/building.schema";

export function useCreateBuildingForm() {
  return useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: DEFAULT_BUILDING_FORM,
  });
}

export function useUpdateBuildingForm(defaultValues: BuildingModifyFormValues) {
  return useForm<BuildingModifyFormValues>({
    resolver: zodResolver(buildingModifySchema),
    defaultValues,
  });
}
