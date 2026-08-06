import { useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import StaffFormFields from "./StaffFormFields";
import { useStaffForm } from "../hooks/useStaffForm";
import { useCreateStaff } from "../hooks/useCreateStaff";
import { useStaffFormFields } from "../hooks/useStaffFormFields";
import { useUserRole } from "../../../../hooks/useUserRole";
import { ACCOUNT_POSITIONS, type StaffPosition } from "../constants/staff";
import * as authService from "../../../../services/authService";
import { toast } from "sonner";
import type { StaffFormValues } from "../../../../schemas/staff.schema";

interface StaffCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffCreateModal({ isOpen, onClose, onSuccess }: StaffCreateModalProps) {
  const { isManager, managedBuildingId } = useUserRole();
  const form = useStaffForm();
  const { handleSubmit, reset, watch } = form;

  const createMutation = useCreateStaff();
  const saving = createMutation.isPending;
  const positionVal = watch("position");

  const { buildings, managedBuildingIds, nextUsername, loading } = useStaffFormFields({
    isOpen,
    positionVal,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        fullName: "",
        phone: "",
        position: isManager ? "Kỹ thuật" : "Quản lý",
        buildingId: isManager && managedBuildingId ? managedBuildingId : null,
      });
    }
  }, [isOpen, reset, isManager, managedBuildingId]);

  const onSubmit = (data: StaffFormValues) => {
    const isActor = ACCOUNT_POSITIONS.includes(data.position as StaffPosition);

    createMutation.mutate(
      {
        full_name: data.fullName,
        phone: data.phone || null,
        position: data.position,
        building_id: data.buildingId ? Number(data.buildingId) : null,
      },
      {
        onSuccess: async (res) => {
          let deleteFailed = false;
          if (!isActor && res.user?.id) {
            try {
              await authService.remove(res.user.id);
            } catch (e) {
              console.error("Không thể xóa tài khoản hệ thống cho nhân viên", e);
              deleteFailed = true;
            }
          }

          if (deleteFailed) {
            toast.warning(`Đã thêm nhân viên "${res.full_name}" nhưng không thể hủy tự động tài khoản hệ thống.`);
          } else if (isActor) {
            const username = res.user?.username || nextUsername;
            toast.success(`Đã tự động cấp tài khoản "${username}" và thêm nhân viên thành công!`);
          } else {
            toast.success(`Đã thêm nhân viên "${res.full_name}" thành công.`);
          }

          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } } };
          toast.error(err.response?.data?.error || err.response?.data?.message || "Không thể thêm nhân viên");
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
      title="Thêm nhân viên mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit, onInvalid)} isLoading={saving} disabled={loading} className="rounded-xl font-semibold">
            Thêm mới
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
          />
        </form>
      )}
    </Modal>
  );
}
