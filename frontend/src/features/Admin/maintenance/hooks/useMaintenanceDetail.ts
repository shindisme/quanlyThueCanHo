import { useState, useCallback } from "react";
import type { MaintenanceRequest } from "../../../../types";

export function useMaintenanceDetail() {
  const [isOpen, setIsOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<MaintenanceRequest | null>(null);

  const openModal = useCallback((req: MaintenanceRequest) => {
    setDetailRequest(req);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setDetailRequest(null);
  }, []);

  const updatePriority = useCallback((newPriority: string) => {
    setDetailRequest((prev) => (prev ? { ...prev, priority: newPriority as MaintenanceRequest["priority"] } : null));
  }, []);

  return {
    isOpen,
    setIsOpen,
    detailRequest,
    setDetailRequest,
    openModal,
    closeModal,
    updatePriority,
  };
}
