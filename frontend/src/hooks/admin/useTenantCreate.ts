import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as tenantService from "../../services/tenantService";
import { tenantSchema } from "../../schemas/tenant.schema";
import type { Tenant } from "../../types";

interface UseTenantCreateProps {
  onClose: () => void;
  onSuccess: (newTenantId?: number) => void;
}

export function useTenantCreate({ onClose, onSuccess }: UseTenantCreateProps) {
  const [fullName, setFullName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async ({ payload, username, finalEmail, finalPhone, cleanCitizenId }: {
      payload: Partial<Tenant>;
      username: string;
      finalEmail: string;
      finalPhone: string | null;
      cleanCitizenId: string;
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

      if (cleanCitizenId) {
        const dup = allTenants.find((t) => t.citizen_id === cleanCitizenId);
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
      toast.success(
        `Đã tự động tạo tài khoản "${data.username}" (mật khẩu mặc định: 123123) cho người thuê mới!`
      );
      setFullName("");
      setCitizenId("");
      setDob("");
      setAddress("");
      setEmail("");
      setPhone("");
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

  function handleCreateTenant() {
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

    const cleanCitizenId = citizenId.trim();
    const last6Digits = cleanCitizenId.slice(-6);
    const username = `YH${last6Digits}`;
    const finalEmail = email.trim() || null;
    const finalPhone = phone.trim() || null;
    createMutation.mutate({ payload, username, finalEmail, finalPhone, cleanCitizenId });
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
    handleCreateTenant,
  };
}
