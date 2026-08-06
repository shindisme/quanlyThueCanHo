import { useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import StaffFormFields from "./StaffFormFields";
import { useStaffForm } from "../hooks/useStaffForm";
import { useModifyStaff } from "../hooks/useModifyStaff";
import { useStaffFormFields } from "../hooks/useStaffFormFields";
import { toast } from "sonner";
import type { Staff } from "../../../../types";
import type { StaffFormValues } from "../../../../schemas/staff.schema";

interface StaffModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Staff | null;
}

export default function StaffModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: StaffModifyModalProps) {
  const form = useStaffForm();
  const { handleSubmit, reset, watch } = form;

  const modifyMutation = useModifyStaff();
  const saving = modifyMutation.isPending;
  const positionVal = watch("position");

  const { buildings, managedBuildingIds, nextUsername, loading } = useStaffFormFields({
    isOpen,
    positionVal,
    currentStaffId: editItem?.id,
    currentUserId: editItem?.user_id,
  });

  useEffect(() => {
    if (editItem && isOpen) {
      reset({
        fullName: editItem.full_name,
        phone: editItem.phone || "",
        position: (editItem.position as StaffFormValues["position"]) || "Quản lý",
        buildingId: editItem.building_id || null,
      });
    }
  }, [editItem, isOpen, reset]);

  const onSubmit = (data: StaffFormValues) => {
    if (!editItem) return;

    modifyMutation.mutate(
      {
        id: editItem.id,
        fullName: data.fullName,
        phone: data.phone || null,
        position: data.position,
        buildingId: data.buildingId ? Number(data.buildingId) : null,
        hasUser: !!editItem.user_id,
        userId: editItem.user_id,
        nextUsername,
      },
      {
        onSuccess: (res) => {
          if (res.createdAccount) {
            toast.success(
              `Đã tự động cấp tài khoản "${res.nextUsername}" cho vị trí mới! Mật khẩu: ${res.initialPassword || "123123"}`
            );
          } else if (res.deletedAccount) {
            toast.success("Đã cập nhật nhân viên và hủy tài khoản hệ thống.");
          } else {
            toast.success("Cập nhật thông tin nhân viên thành công!");
          }

          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } } };
          toast.error(err.response?.data?.error || err.response?.data?.message || "Không thể cập nhật nhân viên");
        },
      }
    );
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    const first = Object.values(fieldErrors)[0] as { message?: string } | undefined;
    toast.error(first?.message || "Vui lòng kiểm tra và điền đầy đủ các thông tin nhân viên!");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin nhân viên"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit, onInvalid)} isLoading={saving} disabled={loading} className="rounded-xl font-semibold">
            Cập nhật
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <StaffFormFields
            form={form}
            buildings={buildings}
            managedBuildingIds={managedBuildingIds}
            positionVal={positionVal}
            nextUsername={nextUsername}
            editItem={editItem}
          />
        </form>
      )}
    </Modal>
  );
}
