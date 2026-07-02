import { useState, useEffect } from "react";
import { toast } from "sonner";
import * as buildingService from "../services/buildingService";
import type { BuildingData } from "../services/buildingService";
import { buildingSchema } from "../schemas/building.schema";

import { isValidImageFile } from "../utils/file";

interface UseBuildingModifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: BuildingData | null;
}

export function useBuildingModify({ isOpen, onClose, onSuccess, editItem }: UseBuildingModifyProps) {
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
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

  async function fetchManagers() {
    try {
      const { getAllStaff } = await import("../services/staffService");
      const staffRes = await getAllStaff();
      setStaffList(staffRes.data);
    } catch {
      toast.error("Không thể tải danh sách người quản lý");
    }
  }

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

  async function handleSave() {
    if (!editItem) return;
    const result = buildingSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const jsonPayload: any = {
        name: formData.name,
        branch_name: formData.branch_name,
        address_old: formData.address_old,
        address_new: formData.address_new,
        total_floors: Number(formData.total_floors),
        description: formData.description || "",
      };

      jsonPayload.staff_id = formData.staff_id !== null && formData.staff_id !== undefined ? Number(formData.staff_id) : null;

      await buildingService.updateBuilding(editItem.id, jsonPayload);

      if (thumbnailFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("image", thumbnailFile);
        await buildingService.updateBuilding(editItem.id, formDataToSend);
      }

      toast.success("Đã cập nhật tòa nhà");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
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
