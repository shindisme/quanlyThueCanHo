import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useUpdateBuildingForm } from "../hooks/useBuildingForm";
import { useUpdateBuilding } from "../hooks/useUpdateBuilding";
import * as staffService from "../../../../services/staffService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { isValidImageFile } from "../../../../utils/file";
import { toast } from "sonner";
import type { Building } from "../../../../types";
import type { BuildingModifyFormValues } from "../../../../schemas/building.schema";

interface BuildingModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Building | null;
}

export default function BuildingModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: BuildingModifyModalProps) {
  const form = useUpdateBuildingForm({
    branch_name: "",
    address_old: "",
    address_new: "",
    total_floors: 0,
    staff_id: null,
    status: "ACTIVE",
    description: "",
  });
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const updateMutation = useUpdateBuilding();
  const saving = updateMutation.isPending;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Load staff/managers
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllStaffs(),
    enabled: isOpen,
  });
  const staffList = staffRes?.data || [];

  // Lọc quản lý chưa có tòa nhà phụ trách (hoặc đang quản lý tòa nhà hiện tại)
  const availableManagers = staffList.filter((m: any) => {
    const isManager = m.position === "Quản lý" || m.user?.role === "MANAGER";
    if (!isManager) return false;
    if (m.user?.role === "ADMIN") return false;
    if (!m.building_id) return true;
    if (editItem && m.building_id === editItem.id) return true;
    return false;
  });

  useEffect(() => {
    if (editItem && isOpen) {
      reset({
        branch_name: editItem.branch_name || "",
        address_old: editItem.address_old || "",
        address_new: editItem.address_new || "",
        total_floors: editItem.total_floors || 0,
        staff_id: editItem.manager_id || null,
        status: (editItem.status as any) || "ACTIVE",
        description: editItem.description || "",
      });
      setPreviewUrl(editItem.thumbnail_url || "");
      setThumbnailFile(null);
    }
  }, [editItem, isOpen, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const check = isValidImageFile(file);
      if (!check.valid) {
        toast.error(check.error || "Tệp không hợp lệ");
        return;
      }
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success("Đã chọn ảnh");
    }
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setPreviewUrl("");
  };

  const onSubmit = (data: BuildingModifyFormValues) => {
    if (!editItem) return;

    updateMutation.mutate(
      { id: editItem.id, data, image: thumbnailFile },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật tòa nhà");
          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } } };
          toast.error(err.response?.data?.error || err.response?.data?.message || "Thao tác thất bại");
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa tòa nhà"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving} disabled={loadingStaff}>Cập nhật</Button>
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
            <div className="col-span-12">
              <Input
                label="Tên chi nhánh/tòa nhà *"
                placeholder="Nhập tên chi nhánh/tòa nhà"
                error={errors.branch_name?.message}
                className="rounded-md"
                {...register("branch_name")}
              />
            </div>

            <div className="col-span-12 sm:col-span-6">
              <Input
                label="Địa chỉ cũ *"
                placeholder="Nhập địa chỉ cũ"
                error={errors.address_old?.message}
                className="rounded-md"
                {...register("address_old")}
              />
            </div>

            <div className="col-span-12 sm:col-span-6">
              <Input
                label="Địa chỉ mới *"
                placeholder="Nhập địa chỉ mới"
                error={errors.address_new?.message}
                className="rounded-md"
                {...register("address_new")}
              />
            </div>

            <div className="col-span-12">
              <Input
                label="Số tầng *"
                type="number"
                error={errors.total_floors?.message}
                className="rounded-md"
                {...register("total_floors", { valueAsNumber: true })}
              />
            </div>

            <div className="col-span-12">
              <Controller
                control={control}
                name="staff_id"
                render={({ field, fieldState: { error } }) => (
                  <Combobox
                    label="Quản lý bởi"
                    options={availableManagers.map((s: any) => ({
                      value: String(s.id),
                      label: `${s.full_name} (${s.user?.username || s.position})`,
                    }))}
                    value={field.value ? String(field.value) : ""}
                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                    placeholder="-- Chưa phân công --"
                    searchPlaceholder="Tìm người quản lý..."
                    triggerClassName="rounded-md"
                    clearable={true}
                    error={error?.message}
                  />
                )}
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
                      { value: "ACTIVE", label: "Hoạt động" },
                      { value: "INACTIVE", label: "Dừng hoạt động" }
                    ]}
                    value={field.value || ""}
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
                  id="modify-building-image"
                />
                <label
                  htmlFor="modify-building-image"
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                >
                  Chọn ảnh mới
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
