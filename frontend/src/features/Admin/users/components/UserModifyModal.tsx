import { useEffect, useState } from "react";
import { Controller, type FieldErrors } from "react-hook-form";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useUpdateUserForm } from "../hooks/useUserForm";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from "../../../../constants/labels";
import type { User } from "../../../../types";
import type { UpdateUserFormValues } from "../../../../schemas/user.schema";
import { toast } from "sonner";
import * as tenantService from "../../../../services/tenantService";
import * as staffService from "../../../../services/staffService";

interface UserModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  initialFullName: string;
  tenantId: number | null;
  staffId: number | null;
}

async function updateLinkedProfile({
  role,
  username,
  fullName,
  tenantId,
  staffId,
}: {
  role: string;
  username: string;
  fullName: string;
  tenantId: number | null;
  staffId: number | null;
}) {
  const trimmed = fullName.trim();
  if (!trimmed) return;

  if (role === "ADMIN") {
    localStorage.setItem(`profile-fullname-${username}`, trimmed);
    window.dispatchEvent(new Event("profile-update"));
  } else if (role === "TENANT" && tenantId) {
    await tenantService.update(tenantId, { full_name: trimmed });
    window.dispatchEvent(new Event("profile-update"));
  } else if ((role === "MANAGER" || role === "STAFF") && staffId) {
    await staffService.update(staffId, { full_name: trimmed });
    window.dispatchEvent(new Event("profile-update"));
  }
}

export default function UserModifyModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  initialFullName,
  tenantId,
  staffId,
}: UserModifyModalProps) {
  const form = useUpdateUserForm({
    full_name: "",
    username: "",
    role: "TENANT",
    status: "ACTIVE",
  });
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const updateUserMutation = useUpdateUser();
  const saving = updateUserMutation.isPending;
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      reset({
        full_name: initialFullName || "",
        username: user.username || "",
        role: user.role || "TENANT",
        status: user.status || "ACTIVE",
      });
    }
  }, [isOpen, user, reset, initialFullName]);

  const onSubmit = async (data: UpdateUserFormValues) => {
    if (!user) return;
    const fullNameStr = data.full_name || "";

    setUpdatingProfile(true);
    try {
      await updateLinkedProfile({
        role: user.role,
        username: user.username,
        fullName: fullNameStr,
        tenantId,
        staffId,
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật họ tên liên kết:", err);
      toast.error("Không thể cập nhật họ tên liên kết.");
      setUpdatingProfile(false);
      return;
    }

    const { full_name, ...updateUserData } = data;
    updateUserMutation.mutate(
      { id: user.id, data: updateUserData },
      {
        onSuccess: () => {
          toast.success("Cập nhật tài khoản thành công");
          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
          toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Cập nhật tài khoản thất bại");
        },
        onSettled: () => {
          setUpdatingProfile(false);
        },
      }
    );
  };

  const isSaving = saving || updatingProfile;

  const onInvalid = (fieldErrors: FieldErrors<UpdateUserFormValues>) => {
    const first = Object.values(fieldErrors)[0] as { message?: string } | undefined;
    if (first?.message) {
      toast.error(first.message);
    } else {
      toast.error("Vui lòng kiểm tra và điền đầy đủ các thông tin tài khoản!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSaving && onClose()}
      title="Chỉnh sửa thông tin tài khoản"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving} className="rounded-xl">
            Hủy
          </Button>
          <Button type="submit" form="user-modify-form" isLoading={isSaving} className="rounded-xl font-semibold">
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <form id="user-modify-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5 text-left font-sans">
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12">
            <Input
              label="Họ và tên *"
              type="text"
              placeholder="Nhập họ và tên..."
              className={`rounded-lg ${user?.role === "ADMIN" ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
              disabled={isSaving || user?.role === "ADMIN"}
              error={errors.full_name?.message}
              {...register("full_name")}
            />
            {user?.role === "ADMIN" && (
              <span className="text-[11px] text-gray-400 mt-1 block">Tên Quản trị viên sử dụng mặc định và không thể chỉnh sửa.</span>
            )}
          </div>
          <div className="col-span-12">
            <Input
              label="Tên tài khoản *"
              type="text"
              placeholder="Nhập username"
              className="rounded-lg bg-gray-100 cursor-not-allowed"
              disabled={true}
              error={errors.username?.message}
              {...register("username")}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Controller
              control={control}
              name="role"
              render={({ field, fieldState: { error } }) => (
                <Combobox
                  label="Vai trò *"
                  options={USER_ROLE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn vai trò"
                  searchable={false}
                  disabled={isSaving}
                  triggerClassName="rounded-lg"
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Controller
              control={control}
              name="status"
              render={({ field, fieldState: { error } }) => (
                <Combobox
                  label="Trạng thái *"
                  options={USER_STATUS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn trạng thái"
                  searchable={false}
                  disabled={isSaving}
                  triggerClassName="rounded-lg"
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
