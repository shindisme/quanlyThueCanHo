import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as maintenanceService from "../../../../services/maintenanceService";
import { unableMaintenanceSchema } from "../../../../schemas/maintenance.schema";
import { useMaintenanceMutation } from "./useMaintenanceMutation";
import type { MaintenanceRequest } from "../../../../types";

interface UseMaintenanceUnableProps {
  onSuccess?: () => void;
}

export function useMaintenanceUnable({ onSuccess }: UseMaintenanceUnableProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [unableReason, setUnableReason] = useState<string>("");

  const reset = useCallback(() => {
    setIsOpen(false);
    setSelectedRequest(null);
    setUnableReason("");
  }, []);

  const openModal = useCallback((req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setUnableReason("");
    setIsOpen(true);
  }, []);

  const unableMutation = useMaintenanceMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      maintenanceService.unable(id, { reason }),
    successMessage: "Đã báo cáo không thể sửa chữa thành công",
    errorMessage: "Không thể gửi báo cáo",
    onSuccess: () => {
      reset();
      if (onSuccess) onSuccess();
    },
  });

  const handleUnableSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const trimmedReason = unableReason.trim();
    const validation = unableMaintenanceSchema.safeParse({ reason: trimmedReason });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Lý do không hợp lệ");
      return;
    }

    unableMutation.mutate({ id: selectedRequest.id, reason: trimmedReason });
  }, [selectedRequest, unableReason, unableMutation]);

  return {
    isOpen,
    setIsOpen,
    selectedRequest,
    unableReason,
    setUnableReason,
    openModal,
    closeModal: reset,
    handleUnableSubmit,
    isPending: unableMutation.isPending,
  };
}
