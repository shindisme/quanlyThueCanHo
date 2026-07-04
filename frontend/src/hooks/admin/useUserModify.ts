import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../../services/authService";
import type { UserData } from "../../services/authService";
import { toast } from "sonner";

interface UseUserModifyProps {
  user: UserData | null;
  onClose: () => void;
  onSuccess: () => void;
  initialFullName: string;
}

export function useUserModify({ user, onClose, onSuccess, initialFullName }: UseUserModifyProps) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("TENANT");
  const [status, setStatus] = useState("ACTIVE");
  const [fullName, setFullName] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setRole(user.role || "TENANT");
      setStatus(user.status || "ACTIVE");
      setFullName(initialFullName === "-" ? "" : initialFullName);
    }
  }, [user, initialFullName]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; username: string; role: string; status: string }) =>
      authService.updateUser(data.id, { username: data.username, role: data.role, status: data.status }),
    onSuccess: () => {
      if (username) {
        localStorage.setItem(`profile-fullname-${username}`, fullName.trim());
      }
      toast.success("Cập nhật tài khoản thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Cập nhật tài khoản thất bại");
    }
  });

  const saving = updateMutation.isPending;

  function handleSave() {
    if (!username.trim()) {
      toast.error("Tên tài khoản không được để trống");
      return;
    }
    if (!user) return;
    updateMutation.mutate({ id: user.id, username, role, status });
  }

  return {
    username,
    setUsername,
    role,
    setRole,
    status,
    setStatus,
    fullName,
    setFullName,
    saving,
    handleSave,
  };
}
