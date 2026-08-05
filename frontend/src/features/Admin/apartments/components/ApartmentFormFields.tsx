import { useMemo } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import Button from "../../../../components/ui/Button";
import type { Building } from "../../../../types";

interface ApartmentFormFieldsProps {
  form: UseFormReturn<any>;
  buildings: Building[];
  role: string | null;
  localThumbnail: string;
  localImages: string[];
  handleThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDetailImageChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  removeThumbnail: () => void;
  removeDetailImage: (index: number) => void;
  isEdit?: boolean;
}

export default function ApartmentFormFields({
  form,
  buildings,
  role,
  localThumbnail,
  localImages,
  handleThumbnailChange,
  handleDetailImageChange,
  removeThumbnail,
  removeDetailImage,
  isEdit = false,
}: ApartmentFormFieldsProps) {
  const { register, control, watch, formState: { errors } } = form;

  const selectedBuildingId = watch("building_id");
  const selectedBuilding = useMemo(
    () => buildings.find((b) => Number(b.id) === Number(selectedBuildingId)),
    [buildings, selectedBuildingId]
  );

  const totalFloors = selectedBuilding?.total_floors || 10;
  const floorOptions = useMemo(
    () =>
      Array.from({ length: totalFloors }, (_, i) => ({
        value: String(i + 1),
        label: `Tầng ${i + 1}`,
      })),
    [totalFloors]
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 sm:col-span-6">
        <Input
          label="Số phòng *"
          type="text"
          placeholder="Nhập số phòng. VD: 01, 02,..."
          className="rounded-md"
          error={errors.room_number?.message as string | undefined}
          {...register("room_number")}
        />
      </div>

      <div className="col-span-12 sm:col-span-6">
        <Controller
          control={control}
          name="building_id"
          render={({ field, fieldState: { error } }) => (
            <Combobox
              label="Chi nhánh *"
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={field.value ? String(field.value) : ""}
              onChange={(val) => field.onChange(val ? Number(val) : 0)}
              disabled={role === "MANAGER"}
              placeholder="Chọn chi nhánh"
              searchPlaceholder="Tìm chi nhánh..."
              triggerClassName="rounded-md"
              clearable={false}
              error={error?.message}
            />
          )}
        />
      </div>

      <div className="col-span-12 sm:col-span-4">
        <Controller
          control={control}
          name="floor"
          render={({ field, fieldState: { error } }) => (
            <Combobox
              label="Tầng *"
              options={floorOptions}
              value={field.value ? String(field.value) : "1"}
              onChange={(val) => field.onChange(val ? Number(val) : 1)}
              placeholder="Chọn tầng"
              searchable={totalFloors > 5}
              searchPlaceholder="Tìm tầng..."
              triggerClassName="rounded-md"
              clearable={false}
              error={error?.message}
            />
          )}
        />
      </div>

      <div className="col-span-12 sm:col-span-4">
        <Input
          label="Diện tích (m²)"
          type="number"
          step="any"
          className="rounded-md"
          error={errors.area?.message as string | undefined}
          {...register("area", { valueAsNumber: true })}
        />
      </div>

      <div className="col-span-12 sm:col-span-4">
        <Input
          label="Giá thuê (đ/tháng) *"
          type="number"
          className="rounded-md"
          error={errors.rental_price?.message as string | undefined}
          {...register("rental_price", { valueAsNumber: true })}
        />
      </div>

      <div className="col-span-12 sm:col-span-6">
        <Input
          label="Số phòng ngủ *"
          type="number"
          className="rounded-md"
          error={errors.bedrooms?.message as string | undefined}
          {...register("bedrooms", { valueAsNumber: true })}
        />
      </div>

      <div className="col-span-12 sm:col-span-6">
        <Input
          label="Số phòng vệ sinh *"
          type="number"
          className="rounded-md"
          error={errors.bathrooms?.message as string | undefined}
          {...register("bathrooms", { valueAsNumber: true })}
        />
      </div>

      <div className="col-span-12">
        <Controller
          control={control}
          name="status"
          render={({ field, fieldState: { error } }) => (
            <Combobox
              label="Trạng thái *"
              options={[
                { value: "AVAILABLE", label: "Còn trống" },
                { value: "RESERVED", label: "Đã cọc" },
                { value: "RENTED", label: "Đang thuê" },
                { value: "MAINTENANCE", label: "Bảo trì" },
              ]}
              value={field.value}
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

      <div className="col-span-12">
        <Input
          label="Mô tả căn hộ"
          type="text"
          placeholder="Nhập mô tả chi tiết căn hộ"
          error={errors.description?.message as string | undefined}
          className="rounded-md"
          {...register("description")}
        />
      </div>

      {/* Upload ảnh bìa */}
      <div className="col-span-12">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ảnh bìa căn hộ (Thumbnail) *
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="hidden"
            id={`apt-thumb-${isEdit ? "edit" : "create"}`}
          />
          <label
            htmlFor={`apt-thumb-${isEdit ? "edit" : "create"}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
          >
            {isEdit ? "Chọn ảnh bìa mới" : "Chọn ảnh bìa"}
          </label>
          {localThumbnail && (
            <div className="flex items-center gap-2">
              <img src={localThumbnail} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
              <Button variant="outline" size="sm" onClick={removeThumbnail} className="text-red-500">
                Xóa
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload ảnh chi tiết */}
      <div className="col-span-12">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ảnh chi tiết căn hộ (Tối đa 4 ảnh)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center gap-2 min-h-24 bg-gray-50/50"
            >
              {localImages[index] ? (
                <div className="relative w-full h-16">
                  <img src={localImages[index]} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeDetailImage(index)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleDetailImageChange(e, index)}
                    className="hidden"
                    id={`apt-detail-${isEdit ? "edit" : "create"}-${index}`}
                  />
                  <label
                    htmlFor={`apt-detail-${isEdit ? "edit" : "create"}-${index}`}
                    className="text-xs text-primary-600 hover:underline font-semibold cursor-pointer"
                  >
                    Tải ảnh {index + 1}
                  </label>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
