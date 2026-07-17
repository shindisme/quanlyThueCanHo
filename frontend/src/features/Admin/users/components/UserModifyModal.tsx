import { useEffect } from "react";
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

interface UserModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  initialFullName: string;
}

export default function UserModifyModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  initialFullName,
}: UserModifyModalProps) {
  const form = useUpdateUserForm({
    username: "",
    role: "TENANT",
    status: "ACTIVE",
  });
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const updateUserMutation = useUpdateUser();
  const saving = updateUserMutation.isPending;

  useEffect(() => {
    if (isOpen && user) {
      reset({
        username: user.username || "",
        role: user.role || "TENANT",
        status: user.status || "ACTIVE",
      });
    }
  }, [isOpen, user, reset]);

  const onSubmit = (data: UpdateUserFormValues) => {
    if (!user) return;
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
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa tài khoản"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving}>Lưu thay đổi</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input
              label="Họ và tên (Quản lý tại trang hồ sơ liên kết)"
              type="text"
              value={initialFullName}
              disabled={true}
              className="rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
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
