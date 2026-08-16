import { Controller, type UseFormReturn } from "react-hook-form";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import { STAFF_POSITIONS } from "../../../../constants/staff";
import { useUserRole } from "../../../../hooks/useUserRole";
import type { Building, Staff } from "../../../../types";
import type { StaffFormValues } from "../../../../schemas/staff.schema";

interface StaffFormFieldsProps {
  form: UseFormReturn<StaffFormValues>;
  buildings: Building[];
  managedBuildingIds: number[];
  positionVal: string;
  nextUsername?: string;
  editItem?: Staff | null;
}

export default function StaffFormFields({
  form,
  buildings,
  managedBuildingIds,
  positionVal,
  editItem,
}: StaffFormFieldsProps) {
  const { isManager } = useUserRole();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const availablePositions = isManager
    ? STAFF_POSITIONS.filter((pos) => pos !== "Quản lý")
    : STAFF_POSITIONS;

  return (
    <div className="space-y-6 text-sm font-sans">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Họ tên *"
            placeholder="Nhập họ tên"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Controller
            control={control}
            name="position"
            render={({ field, fieldState: { error } }) => (
              <Combobox
                label="Chức vụ *"
                options={availablePositions.map((pos) => ({
                  value: pos,
                  label: pos,
                }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Chọn chức vụ"
                searchable={false}
                triggerClassName="rounded-xl border-gray-300"
                clearable={false}
                error={error?.message}
              />
            )}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Controller
            control={control}
            name="buildingId"
            render={({ field, fieldState: { error } }) => (
              <Combobox
                label="Tòa nhà làm việc"
                options={buildings.map((b) => {
                  const isAlreadyManaged =
                    positionVal === "Quản lý" &&
                    managedBuildingIds.includes(b.id) &&
                    editItem?.building_id !== b.id;
                  return {
                    value: String(b.id),
                    label: `${b.branch_name} ${isAlreadyManaged ? "(Đã có Quản lý)" : ""}`,
                    disabled: isAlreadyManaged,
                  };
                })}
                value={field.value ? String(field.value) : ""}
                onChange={(val) => field.onChange(val ? Number(val) : null)}
                placeholder="-- Chưa gán tòa nhà --"
                triggerClassName={`rounded-xl border-gray-300 ${isManager ? "bg-gray-100 cursor-not-allowed" : ""}`}
                clearable={!isManager}
                disabled={isManager}
                error={error?.message}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
