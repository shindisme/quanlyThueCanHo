import { useEffect, useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ApartmentFormFields from "./ApartmentFormFields";
import { useApartmentForm } from "../hooks/useApartmentForm";
import { useUpdateApartment } from "../hooks/useUpdateApartment";
import type { Building } from "../../../../types";
import type { Apartment } from "../../../../types";
import type { ApartmentFormValues } from "../../../../schemas/apartment.schema";
import { isValidImageFile } from "../../../../utils/file";
import { toast } from "sonner";
import { getFirstFormErrorMessage } from "../../../../utils/formError";

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
  const { handleSubmit, reset } = form;

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

    if (localThumbnail && !localThumbnail.startsWith("blob:")) {
      formDataToSend.append("thumbnail_image_url", localThumbnail);
    }

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

  const onInvalid = (errors: unknown) => {
    toast.error(getFirstFormErrorMessage(errors) || "Vui lòng kiểm tra thông tin căn hộ.");
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
          <Button onClick={handleSubmit(onSubmit, onInvalid)} isLoading={saving}>Cập nhật</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
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
          isEdit={true}
        />
      </form>
    </Modal>
  );
}
