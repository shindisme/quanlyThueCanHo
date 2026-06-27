import { useState } from "react";
import { toast } from "sonner";
import * as tenantService from "../services/tenantService";
import * as authService from "../services/authService";
import { tenantSchema } from "../schemas/tenant.schema";

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
  const [loading, setLoading] = useState(false);

  async function handleSaveTenantAndUser() {
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

    setLoading(true);
    try {
      const allTenantsRes = await tenantService.getAllTenants({ limit: 1000 }).catch(() => ({ data: [] }));
      const allTenants = allTenantsRes.data || [];

      if (finalPhone) {
        const dup = allTenants.find((t) => t.phone === finalPhone);
        if (dup) {
          toast.error("Số điện thoại này đã tồn tại trong hệ thống.");
          setLoading(false);
          return;
        }
      }

      if (finalEmail) {
        const dup = allTenants.find(
          (t) => t.email && t.email.toLowerCase() === finalEmail.toLowerCase()
        );
        if (dup) {
          toast.error("Email này đã tồn tại trong hệ thống.");
          setLoading(false);
          return;
        }
      }

      if (cleanCCCD) {
        const dup = allTenants.find((t) => t.citizen_id === cleanCCCD);
        if (dup) {
          toast.error("Số CCCD này đã tồn tại trong hệ thống.");
          setLoading(false);
          return;
        }
      }

      let createdUserId: number | null = null;
      const userRes = await authService.createUser({
        username,
        role: "TENANT",
      });
      createdUserId = userRes.userId;

      let tenant;
      try {
        tenant = await tenantService.createTenant({
          full_name: formFullName,
          citizen_id: formCitizenId,
          date_of_birth: formDob ? new Date(formDob).toISOString() : null,
          address: formAddress || null,
          email: finalEmail,
          phone: finalPhone,
          user_id: userRes.userId,
        });
      } catch (tenantError) {
        if (createdUserId) {
          await authService.deleteUser(createdUserId).catch((err) => {
            console.error("failed:", err);
          });
        }
        throw tenantError;
      }

      toast.success(`Đã tự động tạo tài khoản "${username}" cho người thuê mới!`);

      // Reset fields
      setFormFullName("");
      setFormCitizenId("");
      setFormDob("");
      setFormAddress("");
      setFormEmail("");
      setFormPhone("");

      onSuccess(tenant.id);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo người thuê");
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
    handleSaveTenantAndUser,
  };
}
