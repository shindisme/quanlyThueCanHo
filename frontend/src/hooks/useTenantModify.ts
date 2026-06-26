import { useState, useEffect } from "react";
import { toast } from "sonner";
import * as tenantService from "../services/tenantService";
import type { Tenant } from "../types";
import { tenantSchema } from "../schemas/tenant.schema";

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
  const [loading, setLoading] = useState(false);

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

  async function handleEditSave() {
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
    setLoading(true);
    try {
      await tenantService.updateTenant(editItem.id, {
        full_name: formFullName,
        citizen_id: formCitizenId,
        date_of_birth: formDob ? new Date(formDob).toISOString() : null,
        address: formAddress || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
      });

      toast.success("Đã cập nhật thông tin người thuê thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
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
