import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  apartmentSchema,
  type ApartmentFormValues,
} from "../../../../schemas/apartment.schema";

// khởi tạo form quản lý thông tin căn hộ
export function useApartmentForm(defaultValues?: Partial<ApartmentFormValues>) {
  return useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentSchema) as any,
    defaultValues: {
      room_number: "",
      building_id: 0,
      floor: 1,
      area: 0,
      bedrooms: 1,
      bathrooms: 1,
      rental_price: 0,
      description: "",
      status: "AVAILABLE",
      ...defaultValues,
    },
  });
}
