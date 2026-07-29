import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useApartmentForm } from "../hooks/useApartmentForm";
import { useUpdateApartment } from "../hooks/useUpdateApartment";
import type { Building } from "../../../../types";
import type { Apartment } from "../../../../types";
import type { ApartmentFormValues } from "../../../../schemas/apartment.schema";
import { isValidImageFile } from "../../../../utils/file";
import { toast } from "sonner";

interface ApartmentModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Apartment | null;
  buildings: Building[];
  role: string | null;
  activeContractId?: number;
}

export default function ApartmentModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  buildings,
  role,
  activeContractId,
}: ApartmentModifyModalProps) {
  const form = useApartmentForm();
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const updateMutation = useUpdateApartment();
  const saving = updateMutation.isPending;

  const [localThumbnail, setLocalThumbnail] = useState<string>("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [detailFiles, setDetailFiles] = useState<(File | null)[]>([null, null, null, null]);

  useEffect(() => {
    if (editItem && isOpen) {
      reset({
        room_number: editItem.room_number,
        building_id: editItem.building_id,
        floor: editItem.floor,
        area: editItem.area,
        bedrooms: editItem.bedrooms,
        bathrooms: editItem.bathrooms,
        rental_price: editItem.rental_price,
        description: editItem.description || "",
        status: editItem.status,
      });
      const thumbnail = editItem.images?.find((img) => img.is_thumbnail)?.image_url || "";
      const details =
        editItem.images?.filter((img) => !img.is_thumbnail).map((img) => img.image_url) || [];
      setLocalThumbnail(thumbnail);
      setLocalImages(details);
      setThumbnailFile(null);
      setDetailFiles([null, null, null, null]);
    }
  }, [editItem, isOpen, reset]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const check = isValidImageFile(file);
      if (!check.valid) {
        toast.error(check.error || "Tệp không hợp lệ");
        return;
      }
      setLocalThumbnail(URL.createObjectURL(file));
      setThumbnailFile(file);
    }
  };

  const handleDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const check = isValidImageFile(file);
      if (!check.valid) {
        toast.error(check.error || "Tệp không hợp lệ");
        return;
      }
      const url = URL.createObjectURL(file);
      setLocalImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      setDetailFiles((prev) => {
        const next = [...prev];
        next[index] = file;
        return next;
      });
    }
  };

  const removeThumbnail = () => {
    setLocalThumbnail("");
    setThumbnailFile(null);
  };

  const removeDetailImage = (index: number) => {
    setLocalImages((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setDetailFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const onSubmit = (data: ApartmentFormValues) => {
    if (!editItem) return;

    const selectedBuilding = buildings.find((b) => b.id === data.building_id);
    if (selectedBuilding) {
      if (data.floor <= 0 || data.floor > selectedBuilding.total_floors) {
        toast.error(`Tầng không tồn tại. Chi nhánh này chỉ có tối đa ${selectedBuilding.total_floors} tầng.`);
        return;
      }
    }

    // Nếu trạng thái đổi sang RENTED nhưng chưa có hợp đồng được chọn hoạt động
    if (data.status === "RENTED" && editItem.status !== "RENTED" && !activeContractId) {
      toast.error("Không thể đổi trạng thái thành 'Đang thuê' khi chưa tạo hợp đồng hoạt động cho phòng này.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("room_number", data.room_number);
    formDataToSend.append("building_id", String(data.building_id));
    formDataToSend.append("floor", String(data.floor));
    formDataToSend.append("area", String(data.area));
    formDataToSend.append("bedrooms", String(data.bedrooms));
    formDataToSend.append("bathrooms", String(data.bathrooms));
    formDataToSend.append("rental_price", String(data.rental_price));
    formDataToSend.append("description", data.description || "");
    formDataToSend.append("status", data.status);

    const existingKeepUrls: string[] = [];
    if (localThumbnail && !localThumbnail.startsWith("blob:")) {
      existingKeepUrls.push(localThumbnail);
    }
    localImages.forEach((imgUrl) => {
      if (imgUrl && !imgUrl.startsWith("blob:")) {
        existingKeepUrls.push(imgUrl);
      }
    });

    if (existingKeepUrls.length > 0) {
      existingKeepUrls.forEach((url) => {
        formDataToSend.append("existing_image_urls", url);
      });
    } else {
      formDataToSend.append("existing_image_urls", JSON.stringify([]));
    }

    if (thumbnailFile) {
      formDataToSend.append("images", thumbnailFile);
    }

    detailFiles.forEach((file) => {
      if (file) {
        formDataToSend.append("images", file);
      }
    });

    updateMutation.mutate(
      { id: editItem.id, data: formDataToSend },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật căn hộ");
          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } };
          toast.error(err.response?.data?.error || "Thao tác thất bại");
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa căn hộ"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving}>Cập nhật</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số phòng *"
              type="text"
              placeholder="Nhập số phòng"
              className="rounded-md"
              error={errors.room_number?.message}
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
            <Input
              label="Tầng *"
              type="number"
              className="rounded-md"
              error={errors.floor?.message}
              {...register("floor", { valueAsNumber: true })}
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Diện tích (m²)"
              type="number"
              step="any"
              className="rounded-md"
              error={errors.area?.message}
              {...register("area", { valueAsNumber: true })}
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Giá thuê (đ/tháng) *"
              type="number"
              className="rounded-md"
              error={errors.rental_price?.message}
              {...register("rental_price", { valueAsNumber: true })}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số phòng ngủ *"
              type="number"
              className="rounded-md"
              error={errors.bedrooms?.message}
              {...register("bedrooms", { valueAsNumber: true })}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số phòng vệ sinh *"
              type="number"
              className="rounded-md"
              error={errors.bathrooms?.message}
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
                    { value: "MAINTENANCE", label: "Bảo trì" }
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
              error={errors.description?.message}
              className="rounded-md"
              {...register("description")}
            />
          </div>

          {/* Upload ảnh bìa */}
          <div className="col-span-12">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh bìa căn hộ (Thumbnail) *</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="modify-apt-thumb"
              />
              <label
                htmlFor="modify-apt-thumb"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
              >
                Chọn ảnh bìa mới
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh chi tiết căn hộ (Tối đa 4 ảnh)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center gap-2 min-h-24 bg-gray-50/50">
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
                        id={`modify-apt-detail-${index}`}
                      />
                      <label
                        htmlFor={`modify-apt-detail-${index}`}
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
      </form>
    </Modal>
  );
}
