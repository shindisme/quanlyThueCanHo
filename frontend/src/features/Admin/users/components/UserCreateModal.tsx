import { useEffect } from "react";
import { Controller } from "react-hook-form";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useCreateUserForm } from "../hooks/useUserForm";
import { useCreateUser } from "../hooks/useCreateUser";
import { toast } from "sonner";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreateModal({ isOpen, onClose, onSuccess }: UserCreateModalProps) {
  const form = useCreateUserForm();
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const createUserMutation = useCreateUser();
  const saving = createUserMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      reset({ username: "", role: "TENANT" });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: { username: string; role: "ADMIN" | "MANAGER" | "STAFF" | "TENANT" }) => {
    createUserMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Đã tạo tài khoản mới (mật khẩu mặc định: 123123)");
        onSuccess();
        onClose();
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Tạo tài khoản thất bại");
      },
    });
  };

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
      title="Thêm tài khoản mới"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit, onInvalid)} isLoading={saving}>Tạo tài khoản</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
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
                  label="Role *"
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
        </div>
        <p className="text-xs text-gray-400">Mật khẩu mặc định: 123123</p>
      </form>
    </Modal>
  );
}
