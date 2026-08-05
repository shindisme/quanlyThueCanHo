import { useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import BuildingFormFields from "./BuildingFormFields";
import { useUpdateBuildingForm } from "../hooks/useBuildingForm";
import { useUpdateBuilding } from "../hooks/useUpdateBuilding";
import { useAvailableManagers } from "../hooks/useAvailableManagers";
import { useImageUpload } from "../../../../hooks/useImageUpload";
import type { BuildingData } from "../../../../types";
import type { BuildingModifyFormValues } from "../../../../schemas/building.schema";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { toast } from "sonner";

interface BuildingModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: BuildingData | null;
}

export default function BuildingModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: BuildingModifyModalProps) {
  const form = useUpdateBuildingForm({
    branch_name: editItem?.branch_name ?? "",
    address: editItem?.address ?? "",
    total_floors: editItem?.total_floors ?? 1,
    staff_id: editItem?.manager_id ?? editItem?.manager?.id ?? null,
    status: (editItem?.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
    description: editItem?.description ?? "",
  });

  const { handleSubmit, reset } = form;

  const updateMutation = useUpdateBuilding();
  const saving = updateMutation.isPending;

  const { availableManagers } = useAvailableManagers(isOpen, editItem?.id);
  const { file, previewUrl, handleImageUpload, handleRemoveImage, resetImage, inputRef } = useImageUpload(editItem?.thumbnail_url ?? "");

  useEffect(() => {
    if (editItem && isOpen) {
      reset({
        branch_name: editItem.branch_name ?? "",
        address: editItem.address ?? "",
        total_floors: editItem.total_floors ?? 1,
        staff_id: editItem.manager_id ?? editItem.manager?.id ?? null,
        status: (editItem.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
        description: editItem.description ?? "",
      });
      resetImage(editItem.thumbnail_url ?? "");
    }
  }, [editItem, isOpen, reset, resetImage]);

  const onSubmit = (data: BuildingModifyFormValues) => {
    if (!editItem) return;

    const isImageRemoved = Boolean(editItem.thumbnail_url) && !previewUrl && !file;

    updateMutation.mutate(
      { id: editItem.id, data, image: file, removeImage: isImageRemoved },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật tòa nhà");
          onSuccess?.();
          onClose();
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error, "Không thể cập nhật tòa nhà"));
        },
      }
    );
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    const first = Object.values(fieldErrors)[0] as { message?: string } | undefined;
    if (first?.message) {
      toast.error(first.message);
    }
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
          <Button type="submit" form="building-modify-form" isLoading={saving}>Cập nhật</Button>
        </>
      }
    >
      <form id="building-modify-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <BuildingFormFields
          form={form}
          availableManagers={availableManagers}
          previewUrl={previewUrl}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          inputRef={inputRef}
          isEdit={true}
        />
      </form>
    </Modal>
  );
}
