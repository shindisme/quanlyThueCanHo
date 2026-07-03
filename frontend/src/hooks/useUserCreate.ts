import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/authService";
import { toast } from "sonner";
import { userCreateSchema } from "../schemas/user.schema";

interface UseUserCreateProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function useUserCreate({ onClose, onSuccess }: UseUserCreateProps) {
  const [formData, setFormData] = useState({ username: "", role: "TENANT" });
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: { username: string; role: string }) => authService.createUser(data),
    onSuccess: () => {
      toast.success("Đã tạo tài khoản mới (mật khẩu mặc định: 123456)");
      setFormData({ username: "", role: "TENANT" });
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
    const result = userCreateSchema.safeParse(formData);
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
