import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../../services/authService";
import { toast } from "sonner";
import { userCreateSchema } from "../../schemas/user.schema";

interface UseUserCreateProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function useUserCreate({ onClose, onSuccess }: UseUserCreateProps) {
  const [formData, setFormData] = useState({ username: "", role: "TENANT", fullName: "" });
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: { username: string; role: string }) =>
      authService.createUser({ username: data.username, role: data.role }),
    onSuccess: (res) => {
      if (formData.fullName.trim()) {
        localStorage.setItem(`profile-fullname-${formData.username}`, formData.fullName.trim());
      }
      const initialPassword = (res as any).initial_password;
      toast.success(`Đã tạo tài khoản mới thành công! Mật khẩu khởi tạo: ${initialPassword || "123456"}`, { duration: 10000 });
      setFormData({ username: "", role: "TENANT", fullName: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Tạo tài khoản thất bại");
    }
  });
  const saving = createMutation.isPending;

  function handleCreate() {
    const result = userCreateSchema.safeParse({ username: formData.username, role: formData.role });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    createMutation.mutate(formData);
  }

  return {
    formData,
    setFormData,
    saving,
    handleCreate,
  };
}
