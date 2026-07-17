import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../../../../services/authService";

export function useResetPasswordUser() {
  return useMutation({
    mutationFn: resetPassword,
  });
}
