import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as maintenanceService from "../../../../services/maintenanceService";
import { useMaintenanceMutation } from "./useMaintenanceMutation";
import type { MaintenanceRequest } from "../../../../types";

interface UseMaintenanceCompleteProps {
  onSuccess?: () => void;
}

export function useMaintenanceComplete({ onSuccess }: UseMaintenanceCompleteProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [chargeTenant, setChargeTenant] = useState(false);
  const [repairFee, setRepairFee] = useState<string>("");

  const reset = useCallback(() => {
    setIsOpen(false);
    setSelectedRequest(null);
    setChargeTenant(false);
    setRepairFee("");
  }, []);

  const openModal = useCallback((req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setChargeTenant(false);
    setRepairFee("");
    setIsOpen(true);
  }, []);

  const completeMutation = useMaintenanceMutation({
    mutationFn: ({ id, charge_tenant, repair_fee }: { id: number; charge_tenant: boolean; repair_fee?: number }) =>
      maintenanceService.complete(id, { charge_tenant, repair_fee }),
    successMessage: "Đã đánh dấu hoàn thành sửa chữa thành công",
    errorMessage: "Không thể hoàn thành yêu cầu",
    additionalInvalidateKeys: [["invoices"]],
    onSuccess: () => {
      reset();
      if (onSuccess) onSuccess();
    },
  });

  const handleCompleteSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const fee = Number(repairFee);
    if (chargeTenant && (!repairFee || !Number.isFinite(fee) || fee <= 0)) {
      toast.error("Vui lòng nhập số tiền phí sửa chữa lớn hơn 0");
      return;
    }

    completeMutation.mutate({
      id: selectedRequest.id,
      charge_tenant: chargeTenant,
      repair_fee: chargeTenant ? fee : undefined,
    });
  }, [selectedRequest, chargeTenant, repairFee, completeMutation]);

  return {
    isOpen,
    setIsOpen,
    selectedRequest,
    chargeTenant,
    setChargeTenant,
    repairFee,
    setRepairFee,
    openModal,
    closeModal: reset,
    handleCompleteSubmit,
    isPending: completeMutation.isPending,
  };
}
