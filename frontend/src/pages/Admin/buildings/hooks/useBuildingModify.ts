import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../services/buildingService";
import type { BuildingData } from "../../services/buildingService";
import { buildingSchema } from "../../schemas/building.schema";
import type { Staff } from "../../types";

import { isValidImageFile } from "../../utils/file";

interface UseBuildingModifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: BuildingData | null;
}

export function useBuildingModify({ isOpen, onClose, onSuccess, editItem }: UseBuildingModifyProps) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async ({ id, jsonPayload, thumbnailFile }: { id: number; jsonPayload: Record<string, unknown>; thumbnailFile: File | null }) => {
      const payloadWithoutName = { ...jsonPayload };
      delete payloadWithoutName.name;
      await buildingService.updateBuilding(id, payloadWithoutName);
      if (thumbnailFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("image", thumbnailFile);
        await buildingService.updateBuilding(id, formDataToSend);
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật tòa nhà");
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err.response?.data?.error || err.response?.data?.message || "Thao tác thất bại");
    }
  });
  const saving = updateMutation.isPending;
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    branch_name: "",
    address_old: "",
    address_new: "",
    total_floors: 0,
    description: "",
    staff_id: null as number | null,
    image_url: "",
  });

  async function fetchManagers() {
    try {
      setLoading(true);
      const { getAllStaff } = await import("../../services/staffService");
      const staffRes = await getAllStaff();
      setStaffList(staffRes.data);
    } catch {
      toast.error("Không thể tải danh sách người quản lý");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editItem && isOpen) {
      setFormData({
        name: editItem.name || "",
        branch_name: editItem.branch_name || "",
        address_old: editItem.address_old || "",
        address_new: editItem.address_new || "",
        total_floors: editItem.total_floors || 0,
        description: editItem.description || "",
        staff_id: editItem.manager_id || null,
        image_url: editItem.thumbnail_url || "",
      });
      setPreviewUrl(editItem.thumbnail_url || "");
      setThumbnailFile(null);
    }
  }, [editItem, isOpen]);

  const availableManagers = staffList.filter((m) => {
    const isManager = m.position === "Quản lý" || m.user?.role === "MANAGER";
    if (!isManager) return false;
    if (m.user?.role === "ADMIN") return false;
    if (!m.building_id) return true;
    if (editItem && m.building_id === editItem.id) return true;
    return false;
  });

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  function handleRemoveImage() {
    setThumbnailFile(null);
    setPreviewUrl("");
  }

  function handleSave() {
    if (!editItem) return;
    const result = buildingSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    const jsonPayload: Record<string, unknown> = {
      name: formData.name,
      branch_name: formData.branch_name,
      address_old: formData.address_old,
      address_new: formData.address_new,
      total_floors: Number(formData.total_floors),
      description: formData.description || "",
    };

    jsonPayload.staff_id = formData.staff_id !== null && formData.staff_id !== undefined ? Number(formData.staff_id) : null;

    updateMutation.mutate({ id: editItem.id, jsonPayload, thumbnailFile });
  }

  return {
    saving,
    loading,
    formData,
    setFormData,
    thumbnailFile,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    handleSave,
    availableManagers,
  };
}
