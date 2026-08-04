import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useUpdateUserForm } from "../hooks/useUserForm";
import { useUpdateUser } from "../hooks/useUpdateUser";
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
    username: "",
    role: "TENANT",
    status: "ACTIVE",
  });
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const updateUserMutation = useUpdateUser();
  const saving = updateUserMutation.isPending;

  const [fullName, setFullName] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      reset({
        username: user.username || "",
        role: user.role || "TENANT",
        status: user.status || "ACTIVE",
      });
      setFullName(initialFullName || "");
    }
  }, [isOpen, user, reset, initialFullName]);

  const onSubmit = async (data: UpdateUserFormValues) => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }

    setUpdatingProfile(true);
    try {
      if (user.role === "ADMIN") {
        localStorage.setItem(`profile-fullname-${user.username}`, fullName.trim());
        window.dispatchEvent(new Event("profile-update"));
      } else if (user.role === "TENANT" && tenantId) {
        await tenantService.updateTenant(tenantId, { full_name: fullName.trim() });
        window.dispatchEvent(new Event("profile-update"));
      } else if ((user.role === "MANAGER" || user.role === "STAFF") && staffId) {
        await staffService.updateStaff(staffId, { full_name: fullName.trim() });
        window.dispatchEvent(new Event("profile-update"));
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật họ tên liên kết:", err);
      toast.error("Không thể cập nhật họ tên liên kết.");
      setUpdatingProfile(false);
      return;
    }

    updateUserMutation.mutate(
      { id: user.id, data },
      {
        onSuccess: () => {
          toast.success("Cập nhật tài khoản thành công");
          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } };
          toast.error(err.response?.data?.error || "Cập nhật tài khoản thất bại");
        },
        onSettled: () => {
          setUpdatingProfile(false);
        }
      }
    );
  };

  const isSaving = saving || updatingProfile;

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
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
      onClose={onClose}
      title="Chỉnh sửa tài khoản"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit, onInvalid)} isLoading={isSaving}>Lưu thay đổi</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input
              label="Họ và tên *"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl"
              placeholder="Nhập họ và tên..."
            />
          </div>
          <div className="col-span-12">
            <Input
              label="Username *"
              type="text"
              placeholder="Nhập username"
              className="rounded-md"
              error={errors.username?.message}
              {...register("username")}
            />
          </div>
          <div className="col-span-12">
            <Controller
              control={control}
              name="role"
              render={({ field, fieldState: { error } }) => (
                <Combobox
                  label="Vai trò *"
                  options={[
                    { value: "TENANT", label: "Người thuê (Tenant)" },
                    { value: "MANAGER", label: "Quản lý (Manager)" },
                    { value: "ADMIN", label: "Quản trị viên (Admin)" }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn vai trò"
                  searchable={false}
                  triggerClassName="rounded-md"
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </div>
          <div className="col-span-12">
            <Controller
              control={control}
              name="status"
              render={({ field, fieldState: { error } }) => (
                <Combobox
                  label="Trạng thái *"
                  options={[
                    { value: "ACTIVE", label: "Hoạt động" },
                    { value: "INACTIVE", label: "Tạm khóa" }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn trạng thái"
                  searchable={false}
                  triggerClassName="rounded-md"
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
