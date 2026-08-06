import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as maintenanceService from "../../../../services/maintenanceService";
import { confirmMaintenanceSchema } from "../../../../schemas/maintenance.schema";
import { useMaintenanceMutation } from "./useMaintenanceMutation";
import type { MaintenanceRequest } from "../../../../types";

interface UseMaintenanceAssignProps {
  onSuccess?: () => void;
}

export function useMaintenanceAssign({ onSuccess }: UseMaintenanceAssignProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const reset = useCallback(() => {
    setIsOpen(false);
    setSelectedRequest(null);
    setAssignedStaffId("");
    setScheduledAt("");
  }, []);

  const openModal = useCallback((req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setAssignedStaffId(req.assigned_staff_id ? String(req.assigned_staff_id) : "");
    setScheduledAt(req.scheduled_at || "");
    setIsOpen(true);
  }, []);

  const confirmMutation = useMaintenanceMutation({
    mutationFn: ({ id, data }: { id: number; data: { assigned_staff_id: number; scheduled_at: string } }) =>
      maintenanceService.confirm(id, data),
    successMessage: "Phân công nhân viên xử lý thành công",
    errorMessage: "Không thể phân công yêu cầu",
    onSuccess: () => {
      reset();
      if (onSuccess) onSuccess();
    },
  });

  const handleConfirm = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const validation = confirmMaintenanceSchema.safeParse({
      assigned_staff_id: Number(assignedStaffId),
      scheduled_at: scheduledAt,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Dữ liệu không hợp lệ");
      return;
    }

    confirmMutation.mutate({ id: selectedRequest.id, data: validation.data });
  }, [selectedRequest, assignedStaffId, scheduledAt, confirmMutation]);

  return {
    isOpen,
    setIsOpen,
    selectedRequest,
    assignedStaffId,
    setAssignedStaffId,
    scheduledAt,
    setScheduledAt,
    openModal,
    closeModal: reset,
    handleConfirm,
    isPending: confirmMutation.isPending,
  };
}
