import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as tenantService from "../services/tenantService";
import { tenantSchema } from "../schemas/tenant.schema";
import type { Tenant } from "../types";

interface UseTenantCreateProps {
  onClose: () => void;
  onSuccess: (newTenantId?: number) => void;
}

export function useTenantCreate({ onClose, onSuccess }: UseTenantCreateProps) {
  const [formFullName, setFormFullName] = useState("");
  const [formCitizenId, setFormCitizenId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async ({ payload, username, finalEmail, finalPhone, cleanCCCD }: {
      payload: Partial<Tenant>;
      username: string;
      finalEmail: string;
      finalPhone: string | null;
      cleanCCCD: string;
    }) => {
      const allTenantsRes = await tenantService.getAllTenants({ limit: 100 }).catch(() => ({ data: [] }));
      const allTenants = allTenantsRes.data || [];

      if (finalPhone) {
        const dup = allTenants.find((t) => t.phone === finalPhone);
        if (dup) {
          throw new Error("Số điện thoại này đã tồn tại trong hệ thống.");
        }
      }

      if (finalEmail) {
        const dup = allTenants.find(
          (t) => t.email && t.email.toLowerCase() === finalEmail.toLowerCase()
        );
        if (dup) {
          throw new Error("Email này đã tồn tại trong hệ thống.");
        }
      }

      if (cleanCCCD) {
        const dup = allTenants.find((t) => t.citizen_id === cleanCCCD);
        if (dup) {
          throw new Error("Số CCCD này đã tồn tại trong hệ thống.");
        }
      }

      const tenant = await tenantService.createTenant({
        full_name: payload.full_name,
        citizen_id: payload.citizen_id,
        date_of_birth: payload.date_of_birth,
        address: payload.address || null,
        email: finalEmail,
        phone: finalPhone,
      });
      return { tenant, username: tenant.user?.username || username };
    },
    onSuccess: (data) => {
      toast.success(`Đã tự động tạo tài khoản "${data.username}" cho người thuê mới!`);
      setFormFullName("");
      setFormCitizenId("");
      setFormDob("");
      setFormAddress("");
      setFormEmail("");
      setFormPhone("");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onSuccess(data.tenant.id);
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      toast.error(err.message || err.response?.data?.message || "Không thể tạo người thuê");
    }
  });
  const loading = createMutation.isPending;

  function handleSaveTenantAndUser() {
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

    const cleanCCCD = formCitizenId.trim();
    const last6Digits = cleanCCCD.slice(-6);
    const username = `YH${last6Digits}`;
    const defaultEmail = `${username}@yukihouse.vn`;
    const finalEmail = formEmail.trim() || defaultEmail;
    const finalPhone = formPhone.trim() || null;

    createMutation.mutate({ payload, username, finalEmail, finalPhone, cleanCCCD });
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
    handleSaveTenantAndUser,
  };
}
