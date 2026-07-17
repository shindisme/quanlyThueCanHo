import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../../../../services/authService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { updateStaff } from "../../../../services/staffService";

interface UpdateStaffParams {
  id: number;
  fullName: string;
  phone: string | null;
  position: string;
  buildingId: number | "";
  hasUser: boolean;
  userId: number | null;
  nextUsername: string;
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      fullName,
      phone,
      position,
      buildingId,
      hasUser,
      userId,
      nextUsername,
    }: UpdateStaffParams) => {
      let initialPassword = "";
      let createdAccount = false;
      let deletedAccount = false;

      const isActor = position === "Quản lý" || position === "Kỹ thuật";

      // Nếu chưa có tài khoản, tự động tạo tài khoản nếu chức vụ mới cần tài khoản
      if (!hasUser && isActor) {
        const isManager = position === "Quản lý";
        const roleToCreate = isManager ? "MANAGER" : "STAFF";

        const res = await authService.createUser({
          username: nextUsername,
          role: roleToCreate,
        });
        initialPassword = res.initial_password || "";
        createdAccount = true;
      }

      // Nếu đã có tài khoản từ trước nhưng chức vụ mới không cần tài khoản
      if (hasUser && userId && !isActor) {
        try {
          await authService.deleteUser(userId);
          deletedAccount = true;
        } catch (e) {
          console.error("Không thể xóa tài khoản nhân viên", e);
        }
      }

      await updateStaff(id, {
        full_name: fullName,
        phone: phone || null,
        position,
        building_id: buildingId ? Number(buildingId) : null,
      });

      return {
        hasPriorUser: hasUser,
        nextUsername,
        initialPassword,
        createdAccount,
        deletedAccount,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STAFF });
    },
  });
}
