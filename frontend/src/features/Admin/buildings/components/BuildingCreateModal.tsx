import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useCreateBuildingForm } from "../hooks/useBuildingForm";
import { useCreateBuilding } from "../hooks/useCreateBuilding";
import * as staffService from "../../../../services/staffService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { isValidImageFile } from "../../../../utils/file";
import { toast } from "sonner";
import type { BuildingFormValues } from "../../../../schemas/building.schema";

interface BuildingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuildingCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: BuildingCreateModalProps) {
  const form = useCreateBuildingForm();
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const createMutation = useCreateBuilding();
  const saving = createMutation.isPending;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Load staff/managers
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllStaffs(),
    enabled: isOpen,
  });
  const staffList = staffRes?.data || [];

  // Lọc quản lý chưa có tòa nhà phụ trách
  const availableManagers = staffList.filter((m) => {
    const isManager = m.position === "Quản lý" || m.user?.role === "MANAGER";
    if (!isManager) return false;
    if (m.user?.role === "ADMIN") return false;
    if (!m.building_id) return true;
    return false;
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        branch_name: "",
        address: "",
        total_floors: 0,
        staff_id: null,
        description: "",
      });
      setThumbnailFile(null);
      setPreviewUrl("");
    }
  }, [isOpen, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      toast.error("Vui lòng chọn tệp ảnh hợp lệ (png, jpg, jpeg, webp)");
      return;
    }
    setThumbnailFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setPreviewUrl("");
  };

  const onSubmit = (data: BuildingFormValues) => {
    const fd = new FormData();
    fd.append("branch_name", data.branch_name);
    fd.append("address", data.address);
    fd.append("total_floors", String(data.total_floors));
    if (data.staff_id !== null && data.staff_id !== undefined) {
      fd.append("staff_id", String(data.staff_id));
    }
    if (data.description) {
      fd.append("description", data.description);
    }
    if (thumbnailFile) {
      fd.append("thumbnail", thumbnailFile);
    }

    createMutation.mutate(fd, {
      onSuccess: () => {
        toast.success("Đã thêm tòa nhà mới");
        onSuccess();
        onClose();
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string; message?: string } } };
        toast.error(err.response?.data?.error || err.response?.data?.message || "Thao tác thất bại");
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm chi nhánh/tòa nhà mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving} disabled={loadingStaff}>Thêm mới</Button>
        </>
      }
    >
      {loadingStaff ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6">
              <Input
                label="Tên chi nhánh/tòa nhà *"
                type="text"
                placeholder="Nhập tên chi nhánh/toà nhà"
                error={errors.branch_name?.message}
                className="rounded-md"
                {...register("branch_name")}
              />
            </div>

            <div className="col-span-6">
              <Input
                label="Số tầng *"
                type="number"
                error={errors.total_floors?.message}
                className="rounded-md"
                {...register("total_floors", { valueAsNumber: true })}
              />
            </div>

            <div className="col-span-12">
              <Input
                label="Địa chỉ tòa nhà *"
                type="text"
                placeholder="Nhập địa chỉ đầy đủ của tòa nhà"
                error={errors.address?.message}
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
                      label: `${m.full_name} (${m.phone || "Không có SĐT"})`,
                    }))}
                    value={field.value ? String(field.value) : ""}
                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                    placeholder="Chọn người quản lý chi nhánh"
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
                error={errors.description?.message}
                className="rounded-md"
                {...register("description")}
              />
            </div>

            {/* Ảnh đại diện */}
            <div className="col-span-12">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện (Thumbnail)</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="create-building-image"
                />
                <label
                  htmlFor="create-building-image"
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                >
                  Chọn ảnh
                </label>
                {previewUrl && (
                  <div className="flex items-center gap-2">
                    <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
                    <Button variant="outline" size="sm" onClick={handleRemoveImage} className="text-red-500 hover:text-red-600">
                      Xóa
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
