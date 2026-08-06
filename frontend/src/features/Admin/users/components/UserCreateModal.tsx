import { useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { useCreateUserForm } from "../hooks/useUserForm";
import { useCreateUser } from "../hooks/useCreateUser";
import type { CreateUserFormValues } from "../../../../schemas/user.schema";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreateModal({ isOpen, onClose, onSuccess }: UserCreateModalProps) {
  const form = useCreateUserForm();
  const { register, handleSubmit, reset, setError, formState: { errors } } = form;

  const createUserMutation = useCreateUser();
  const saving = createUserMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      reset({ username: "", role: "ADMIN" });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: CreateUserFormValues) => {
    createUserMutation.mutate(
      { ...data, role: "ADMIN" },
      {
        onSuccess: () => {
          toast.success("Đã tạo tài khoản Admin mới (mật khẩu mặc định: 123123)");
          reset({ username: "", role: "ADMIN" });
          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
          const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Tạo tài khoản thất bại";
          toast.error(errorMsg);
        },
      }
    );
  };

  const onInvalid = () => {
    toast.error("Vui lòng nhập tên tài khoản hợp lệ!");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title="Thêm tài khoản Quản trị viên"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-xl">
            Hủy
          </Button>
          <Button type="submit" form="user-create-form" isLoading={saving} className="rounded-xl font-semibold">
            Tạo tài khoản Admin
          </Button>
        </>
      }
    >
      <form id="user-create-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5 text-left font-sans">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-600 shrink-0" />
          <span>Tài khoản mới sẽ có quyền <b>Quản trị viên (Admin)</b> toàn quyền trên hệ thống.</span>
        </div>

        <div className="space-y-4">
          <Input
            label="Tên tài khoản *"
            type="text"
            autoFocus
            placeholder="Nhập username."
            className="rounded-lg"
            disabled={saving}
            error={errors.username?.message}
            {...register("username")}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 block">Vai trò</label>
            <div className="px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-red-600 flex items-center gap-2">
              Quản trị viên (ADMIN)
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Mật khẩu mặc định khi tạo mới: <span className="font-mono font-semibold text-gray-600">123123</span>
          </p>
        </div>
      </form>
    </Modal>
  );
}
