import { useState } from "react";
import * as authService from "../services/authService";
import { toast } from "sonner";
import { userCreateSchema } from "../schemas/user.schema";

interface UseUserCreateProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function useUserCreate({ onClose, onSuccess }: UseUserCreateProps) {
  const [formData, setFormData] = useState({ username: "", role: "TENANT" });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const result = userCreateSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await authService.createUser(formData);
      toast.success("Đã tạo tài khoản mới (mật khẩu mặc định: 123456)");
      setFormData({ username: "", role: "TENANT" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Tạo tài khoản thất bại");
    } finally {
      setSaving(false);
    }
  }

  return {
    formData,
    setFormData,
    saving,
    handleCreate,
  };
}
