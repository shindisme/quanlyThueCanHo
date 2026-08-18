import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../../../../constants/queryKeys";
import { changePasswordSchema, profileUpdateSchema } from "../../../../schemas/user.schema";
import { changePassword } from "../../../../services/authService";
import * as buildingService from "../../../../services/buildingService";
import * as staffService from "../../../../services/staffService";
import * as tenantService from "../../../../services/tenantService";
import { useAuthStore } from "../../../../stores/auth.store";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { parseJwt } from "../../../../utils/jwt";
import { findActiveContract } from "../../../../utils/contract";

export function useProfile() {
  const queryClient = useQueryClient();
  const { email, role, token } = useAuthStore();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const decoded = token ? parseJwt(token) : null;
  const userIdValue = decoded?.userId ?? decoded?.sub;
  const userId = userIdValue === undefined ? null : Number(userIdValue);

  const tenantProfileQuery = useQuery({
    queryKey: queryKeys.tenants.profile(),
    queryFn: tenantService.getMyProfile,
    enabled: role === "TENANT" && Boolean(token),
  });
  const userContract = findActiveContract(tenantProfileQuery.data?.contracts);
  const apartmentInfo = userContract?.apartment ?? null;
  const buildingInfo = apartmentInfo?.building ?? null;

  const staffQuery = useQuery({
    queryKey: queryKeys.staff.list({ scope: "profile", userId }),
    queryFn: () => staffService.getAllPage(),
    select: (response) => response.data,
    enabled: (role === "MANAGER" || role === "STAFF") && Number.isFinite(userId),
  });
  const currentStaff = useMemo(
    () => staffQuery.data?.find((staff) => staff.user_id === userId) ?? null,
    [staffQuery.data, userId]
  );

  const staffBuildingQuery = useQuery({
    queryKey: queryKeys.buildings.detail(currentStaff?.building_id ?? "none"),
    queryFn: () => buildingService.getById(Number(currentStaff?.building_id)),
    enabled: Boolean(currentStaff?.building_id && !currentStaff?.building),
  });
  const staffBuildingInfo = currentStaff?.building ?? staffBuildingQuery.data ?? null;

  const occupantCount = tenantProfileQuery.data?._count?.occupants ?? 0;
  const maxOccupantsLimit = userContract?.max_occupants && userContract.max_occupants > 0
    ? userContract.max_occupants
    : apartmentInfo?.bedrooms
      ? Math.max(2, apartmentInfo.bedrooms * 2)
      : 4;

  const fullName = role === "TENANT"
    ? tenantProfileQuery.data?.full_name || "Cư dân"
    : role === "MANAGER" || role === "STAFF"
      ? currentStaff?.full_name || "Nhân viên kỹ thuật"
      : "Quản trị viên";
  const phone = role === "TENANT"
    ? tenantProfileQuery.data?.phone || ""
    : role === "MANAGER" || role === "STAFF"
      ? currentStaff?.phone || ""
      : "";

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, password }: { currentPassword: string; password: string }) =>
      changePassword(currentPassword, password),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Đổi mật khẩu thất bại")),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ fullName: nextName, phone: nextPhone }: { fullName: string; phone: string }) => {
      if (role === "TENANT") {
        return tenantService.updateMyProfile({
          full_name: nextName,
          phone: nextPhone || null,
        });
      }
      if ((role === "MANAGER" || role === "STAFF") && currentStaff?.id) {
        return staffService.update(currentStaff.id, {
          full_name: nextName,
          phone: nextPhone || undefined,
        });
      }
      throw new Error("Không tìm thấy hồ sơ liên kết");
    },
    onSuccess: (updatedProfile) => {
      if (role === "TENANT") {
        queryClient.setQueryData(queryKeys.tenants.profile(), updatedProfile);
      }
      if (role === "TENANT") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      }
      window.dispatchEvent(new Event("profile-update"));
      toast.success("Cập nhật thông tin tài khoản thành công!");
      setShowEditProfileModal(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Cập nhật thông tin tài khoản thất bại")),
  });

  const handleOpenEditProfile = () => {
    if (role === "TENANT" && (!userContract || userContract.status !== "ACTIVE")) {
      toast.error("Bạn cần có hợp đồng thuê đang kích hoạt để chỉnh sửa thông tin.");
      return;
    }
    setEditFullName(fullName);
    setEditPhone(phone);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    const normalizedName = editFullName.trim();
    const normalizedPhone = editPhone.trim();
    const result = profileUpdateSchema.safeParse({
      fullName: normalizedName,
      phone: normalizedPhone,
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    updateProfileMutation.mutate({ fullName: normalizedName, phone: normalizedPhone });
  };

  const handleChangePassword = () => {
    const result = changePasswordSchema.safeParse({ oldPass, newPass, confirmPass });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    changePasswordMutation.mutate({ currentPassword: oldPass, password: newPass });
  };

  return {
    email: role === "TENANT" ? tenantProfileQuery.data?.email || email : email,
    role,
    oldPass,
    setOldPass,
    newPass,
    setNewPass,
    confirmPass,
    setConfirmPass,
    saving: changePasswordMutation.isPending,
    profileSaving: updateProfileMutation.isPending,
    profileLoading: tenantProfileQuery.isLoading || staffQuery.isLoading || staffBuildingQuery.isLoading,
    profileError: role === "TENANT" ? tenantProfileQuery.error : staffQuery.error,
    refetchProfile: async () => {
      if (role === "TENANT") {
        await tenantProfileQuery.refetch();
      } else if (role === "MANAGER" || role === "STAFF") {
        await Promise.all([staffQuery.refetch(), staffBuildingQuery.refetch()]);
      }
    },
    canEditProfile: role === "TENANT"
      ? Boolean(tenantProfileQuery.data && userContract && userContract.status === "ACTIVE")
      : role === "MANAGER" || role === "STAFF"
        ? Boolean(currentStaff)
        : false,
    userContract,
    apartmentInfo,
    buildingInfo,
    currentStaff,
    staffBuildingInfo,
    occupantCount,
    handleChangePassword,
    fullName,
    phone,
    editFullName,
    setEditFullName,
    editPhone,
    setEditPhone,
    showEditProfileModal,
    setShowEditProfileModal,
    handleOpenEditProfile,
    handleSaveProfile,
    maxOccupantsLimit,
  };
}
