import { useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import BuildingFormFields from "./BuildingFormFields";
import { useCreateBuildingForm } from "../hooks/useBuildingForm";
import { useCreateBuilding } from "../hooks/useCreateBuilding";
import { useAvailableManagers } from "../hooks/useAvailableManagers";
import { useImageUpload } from "../../../../hooks/useImageUpload";
import { DEFAULT_BUILDING_FORM, type BuildingFormValues } from "../../../../schemas/building.schema";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { toast } from "sonner";

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
  const { handleSubmit, reset } = form;

  const { availableManagers } = useAvailableManagers(isOpen);
  const { file, previewUrl, handleImageUpload, handleRemoveImage, resetImage, inputRef } = useImageUpload();

  const createMutation = useCreateBuilding();
  const saving = createMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      reset(DEFAULT_BUILDING_FORM);
      resetImage();
    }
  }, [isOpen, reset, resetImage]);

  const onSubmit = (data: BuildingFormValues) => {
    const sanitizedData = {
      ...data,
      branch_name: data.branch_name.trim(),
      address: data.address.trim(),
      description: data.description?.trim() || null,
      staff_id: data.staff_id != null ? data.staff_id : null,
    };

    const fd = new FormData();
    Object.entries(sanitizedData).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") {
        fd.append(k, String(v));
      }
    });

    if (file) {
      fd.append("image", file);
    }

    createMutation.mutate(fd, {
      onSuccess: () => {
        toast.success("Đã thêm tòa nhà mới");
        onSuccess();
        onClose();
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error, "Không thể thêm tòa nhà"));
      },
    });
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
      title="Thêm tòa nhà mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" form="building-create-form" isLoading={saving}>Thêm mới</Button>
        </>
      }
    >
      <form id="building-create-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <BuildingFormFields
          form={form}
          availableManagers={availableManagers}
          previewUrl={previewUrl}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          inputRef={inputRef}
          isEdit={false}
        />
      </form>
    </Modal>
  );
}
