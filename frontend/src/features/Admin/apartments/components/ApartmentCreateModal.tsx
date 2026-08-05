import { useEffect, useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ApartmentFormFields from "./ApartmentFormFields";
import { useApartmentForm } from "../hooks/useApartmentForm";
import { useCreateApartment } from "../hooks/useCreateApartment";
import * as apartmentService from "../../../../services/apartmentService";
import type { Building } from "../../../../types";
import type { ApartmentFormValues } from "../../../../schemas/apartment.schema";
import { isValidImageFile } from "../../../../utils/file";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { validateSequentialRoom } from "../../../../utils/string";
import { toast } from "sonner";

interface ApartmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: Building[];
  role: string | null;
  managerBuildingId?: number;
  defaultBuildingId?: number;
  defaultFloor?: number;
}

export default function ApartmentCreateModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  role,
  managerBuildingId,
  defaultBuildingId,
  defaultFloor,
}: ApartmentCreateModalProps) {
  const initialBuildingId =
    defaultBuildingId ??
    (role === "MANAGER" && managerBuildingId ? managerBuildingId : (buildings[0]?.id || 0));
  const initialFloor = defaultFloor ?? 1;

  const form = useApartmentForm({
    building_id: initialBuildingId,
    floor: initialFloor,
  });
  const { handleSubmit, reset } = form;

  const createMutation = useCreateApartment();
  const saving = createMutation.isPending;

  const [localThumbnail, setLocalThumbnail] = useState<string>("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [detailFiles, setDetailFiles] = useState<(File | null)[]>([null, null, null, null]);

  useEffect(() => {
    if (isOpen) {
      reset({
        room_number: "",
        building_id: initialBuildingId,
        floor: initialFloor,
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
  }, [isOpen, initialBuildingId, initialFloor, reset]);

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

  const onSubmit = async (data: ApartmentFormValues) => {
    const selectedBuilding = buildings.find((b) => b.id === data.building_id);
    if (selectedBuilding) {
      if (data.floor <= 0 || data.floor > selectedBuilding.total_floors) {
        toast.error(`Tầng không tồn tại. Chi nhánh này chỉ có tối đa ${selectedBuilding.total_floors} tầng.`);
        return;
      }
    }

    // Kiểm tra tuần tự số phòng ở tầng hiện tại
    try {
      const res = await apartmentService.getAllPage({ building_id: data.building_id });
      const floorApts = (res.data || []).filter((a) => a.floor === data.floor);
      const seqCheck = validateSequentialRoom(data.room_number, data.floor, floorApts);
      if (!seqCheck.valid) {
        toast.error(seqCheck.error);
        return;
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra thứ tự phòng:", err);
    }

    const formDataToSend = new FormData();
    formDataToSend.append("room_number", data.room_number.trim());
    formDataToSend.append("building_id", String(data.building_id));
    formDataToSend.append("floor", String(data.floor));
    formDataToSend.append("area", String(data.area));
    formDataToSend.append("bedrooms", String(data.bedrooms));
    formDataToSend.append("bathrooms", String(data.bathrooms));
    formDataToSend.append("rental_price", String(data.rental_price));
    formDataToSend.append("description", data.description?.trim() || "");
    formDataToSend.append("status", data.status);

    if (thumbnailFile) {
      formDataToSend.append("images", thumbnailFile);
    }

    detailFiles.forEach((file) => {
      if (file) {
        formDataToSend.append("images", file);
      }
    });

    createMutation.mutate(formDataToSend, {
      onSuccess: () => {
        toast.success("Đã thêm căn hộ mới");
        onSuccess();
        onClose();
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error, "Không thể thêm căn hộ"));
      },
    });
  };

  const onInvalid = (errors: Record<string, any>) => {
    const fieldLabels: Record<string, string> = {
      room_number: "Số phòng",
      building_id: "Chi nhánh",
      floor: "Tầng",
      area: "Diện tích",
      bedrooms: "Số phòng ngủ",
      bathrooms: "Số phòng vệ sinh",
      rental_price: "Giá thuê",
      description: "Mô tả",
      status: "Trạng thái",
    };

    const messages = Object.entries(errors)
      .map(([key, err]: [string, any]) => {
        if (!err?.message) return null;
        const label = fieldLabels[key];
        return label ? `${label}: ${err.message}` : String(err.message);
      })
      .filter(Boolean);

    if (messages.length > 0) {
      messages.forEach((msg) => toast.error(String(msg)));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm căn hộ mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" form="apartment-create-form" isLoading={saving}>Thêm mới</Button>
        </>
      }
    >
      <form id="apartment-create-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <ApartmentFormFields
          form={form}
          buildings={buildings}
          role={role}
          localThumbnail={localThumbnail}
          localImages={localImages}
          handleThumbnailChange={handleThumbnailChange}
          handleDetailImageChange={handleDetailImageChange}
          removeThumbnail={removeThumbnail}
          removeDetailImage={removeDetailImage}
          isEdit={false}
        />
      </form>
    </Modal>
  );
}
