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
  const [fullName, setFullName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      setFullName(editItem.full_name);
      setCitizenId(editItem.citizen_id);
      setDob(
        editItem.date_of_birth
          ? new Date(editItem.date_of_birth).toISOString().split("T")[0]
          : ""
      );
      setAddress(editItem.address || "");
      setEmail(editItem.email || "");
      setPhone(editItem.phone || "");
    }
  }, [editItem, isOpen]);

  function handleUpdateTenant() {
    if (!editItem) return;
    const payload = {
      full_name: fullName,
      citizen_id: citizenId,
      date_of_birth: dob || null,
      address: address || null,
      email: email,
      phone: phone,
    };
    const result = tenantSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    updateMutation.mutate({
      id: editItem.id,
      data: {
        full_name: fullName,
        citizen_id: citizenId,
        date_of_birth: dob ? dob : null,
        address: address || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      }
    });
  }

  return {
    fullName,
    setFullName,
    citizenId,
    setCitizenId,
    dob,
    setDob,
    address,
    setAddress,
    email,
    setEmail,
    phone,
    setPhone,
    loading,
    handleUpdateTenant,
  };
}
