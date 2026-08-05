import { Controller, type UseFormReturn } from "react-hook-form";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import Button from "../../../../components/ui/Button";
import type { Staff } from "../../../../types";

interface BuildingFormFieldsProps {
  form: UseFormReturn<any>;
  availableManagers: Staff[];
  previewUrl: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isEdit?: boolean;
}

export default function BuildingFormFields({
  form,
  availableManagers,
  previewUrl,
  onImageUpload,
  onRemoveImage,
  inputRef,
  isEdit = false,
}: BuildingFormFieldsProps) {
  const { register, control, formState: { errors } } = form;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <Input
          label="Tên chi nhánh *"
          type="text"
          placeholder="Nhập tên chi nhánh"
          error={errors.branch_name?.message as string | undefined}
          className="rounded-md"
          {...register("branch_name")}
        />
      </div>

      <div className={isEdit ? "col-span-6" : "col-span-12"}>
        <Input
          label="Số tầng *"
          type="number"
          error={errors.total_floors?.message as string | undefined}
          className="rounded-md"
          {...register("total_floors", { valueAsNumber: true })}
        />
      </div>

      {isEdit && (
        <div className="col-span-6">
          <Controller
            control={control}
            name="status"
            render={({ field, fieldState: { error } }) => (
              <Combobox
                label="Trạng thái *"
                options={[
                  { value: "ACTIVE", label: "Hoạt động" },
                  { value: "INACTIVE", label: "Dừng hoạt động" },
                ]}
                value={field.value || "ACTIVE"}
                onChange={field.onChange}
                placeholder="Chọn trạng thái"
                searchable={false}
                triggerClassName="rounded-md"
                clearable={false}
                error={error?.message}
              />
            )}
          />
        </div>
      )}
      <div className="col-span-12">
        <Input
          label="Địa chỉ tòa nhà *"
          type="text"
          placeholder="Nhập địa chỉ đầy đủ của tòa nhà"
          error={errors.address?.message as string | undefined}
          className="rounded-md"
          {...register("address")}
        />
      </div>

      <div className="col-span-12">
        <Controller
          control={control}
          name="staff_id"
          render={({ field, fieldState: { error } }) => (
            <Combobox
              label="Quản lý chi nhánh (Manager)"
              options={availableManagers.map((m) => ({
                value: String(m.id),
                label: `${m.full_name} (${m.phone || m.user?.username || "Không có SĐT"})`,
              }))}
              value={field.value ? String(field.value) : ""}
              onChange={(val) => field.onChange(val ? Number(val) : null)}
              placeholder="-- Chọn người quản lý chi nhánh --"
              searchPlaceholder="Tìm người quản lý..."
              triggerClassName="rounded-md"
              clearable={true}
              error={error?.message}
            />
          )}
        />
      </div>

      <div className="col-span-12">
        <Input
          label="Mô tả tòa nhà"
          type="text"
          placeholder="Mô tả thông tin tòa nhà"
          error={errors.description?.message as string | undefined}
          className="rounded-md"
          {...register("description")}
        />
      </div>

      {/* Ảnh đại diện */}
      <div className="col-span-12">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ảnh đại diện (Thumbnail)
        </label>
        <div className="flex items-center gap-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            id={`building-image-upload-${isEdit ? "edit" : "create"}`}
          />
          <label
            htmlFor={`building-image-upload-${isEdit ? "edit" : "create"}`}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
          >
            {previewUrl ? "Chọn ảnh khác" : "Chọn ảnh"}
          </label>
          {previewUrl && (
            <div className="flex items-center gap-2">
              <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
              <Button type="button" variant="outline" size="sm" onClick={onRemoveImage} className="text-red-500 hover:text-red-600">
                Xóa
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
