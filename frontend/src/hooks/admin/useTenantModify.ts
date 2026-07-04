import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as tenantService from "../../services/tenantService";
import type { Tenant } from "../../types";
import { tenantSchema } from "../../schemas/tenant.schema";

interface UseTenantModifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Tenant | null;
}

export function useTenantModify({ isOpen, onClose, onSuccess, editItem }: UseTenantModifyProps) {
  const [formFullName, setFormFullName] = useState("");
  const [formCitizenId, setFormCitizenId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Tenant> }) => tenantService.updateTenant(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật thông tin người thuê thành công");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  });
  const loading = updateMutation.isPending;

  useEffect(() => {
    if (editItem && isOpen) {
      setFormFullName(editItem.full_name);
      setFormCitizenId(editItem.citizen_id);
      setFormDob(
        editItem.date_of_birth
          ? new Date(editItem.date_of_birth).toISOString().split("T")[0]
          : ""
      );
      setFormAddress(editItem.address || "");
      setFormEmail(editItem.email || "");
      setFormPhone(editItem.phone || "");
    }
  }, [editItem, isOpen]);

  function handleEditSave() {
    if (!editItem) return;
    const payload = {
      full_name: formFullName,
      citizen_id: formCitizenId,
      date_of_birth: formDob || null,
      address: formAddress || null,
      email: formEmail,
      phone: formPhone,
    };
    const result = tenantSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    updateMutation.mutate({
      id: editItem.id,
      data: {
        full_name: formFullName,
        citizen_id: formCitizenId,
        date_of_birth: formDob ? formDob : null,
        address: formAddress || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
      }
    });
  }

  return {
    formFullName,
    setFormFullName,
    formCitizenId,
    setFormCitizenId,
    formDob,
    setFormDob,
    formAddress,
    setFormAddress,
    formEmail,
    setFormEmail,
    formPhone,
    setFormPhone,
    loading,
    handleEditSave,
  };
}
