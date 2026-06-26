import { useState, useEffect } from "react";
import { toast } from "sonner";
import * as apartmentService from "../services/apartmentService";
import type { BuildingData } from "../services/buildingService";
import { apartmentSchema } from "../schemas/apartment.schema";

interface UseApartmentCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  role: string | null;
  managerBuildingId?: number;
}

export function useApartmentCreate({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  role,
  managerBuildingId,
}: UseApartmentCreateProps) {
  const [saving, setSaving] = useState(false);
  const [localThumbnail, setLocalThumbnail] = useState<string>("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [detailFiles, setDetailFiles] = useState<(File | null)[]>([null, null, null, null]);

  const defaultBuildingId = role === "MANAGER" && managerBuildingId ? managerBuildingId : (buildings[0]?.id || 0);

  const [formData, setFormData] = useState({
    room_number: "",
    building_id: defaultBuildingId,
    floor: 1,
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    rental_price: 0,
    description: "",
    status: "AVAILABLE",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        room_number: "",
        building_id: defaultBuildingId,
        floor: 1,
        area: 0,
        bedrooms: 1,
        bathrooms: 1,
        rental_price: 0,
        description: "",
        status: "AVAILABLE",
      });
      setLocalThumbnail("");
      setLocalImages([]);
      setThumbnailFile(null);
      setDetailFiles([null, null, null, null]);
    }
  }, [isOpen, defaultBuildingId]);

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLocalThumbnail(URL.createObjectURL(file));
      setThumbnailFile(file);
    }
  }

  function handleDetailImageChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (file) {
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
  }

  function removeThumbnail() {
    setLocalThumbnail("");
    setThumbnailFile(null);
  }

  function removeDetailImage(index: number) {
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
  }

  async function handleSave() {
    const result = apartmentSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    const selectedBuilding = buildings.find((b) => b.id === formData.building_id);
    if (selectedBuilding) {
      if (formData.floor <= 0 || formData.floor > selectedBuilding.total_floors) {
        toast.error(`Tầng không tồn tại. Chi nhánh này chỉ có tối đa ${selectedBuilding.total_floors} tầng.`);
        return;
      }
    }
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("room_number", formData.room_number);
      formDataToSend.append("building_id", String(formData.building_id));
      formDataToSend.append("floor", String(formData.floor));
      formDataToSend.append("area", String(formData.area));
      formDataToSend.append("bedrooms", String(formData.bedrooms));
      formDataToSend.append("bathrooms", String(formData.bathrooms));
      formDataToSend.append("rental_price", String(formData.rental_price));
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("status", formData.status);

      if (thumbnailFile) {
        formDataToSend.append("images", thumbnailFile);
      }

      detailFiles.forEach((file) => {
        if (file) {
          formDataToSend.append("images", file);
        }
      });

      await apartmentService.createApartment(formDataToSend);
      toast.success("Đã thêm căn hộ mới");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    localThumbnail,
    localImages,
    thumbnailFile,
    formData,
    setFormData,
    handleThumbnailChange,
    handleDetailImageChange,
    removeThumbnail,
    removeDetailImage,
    handleSave,
  };
}
