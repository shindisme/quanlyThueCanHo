import { useEffect } from "react";
import { Controller } from "react-hook-form";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { useTenantForm } from "../hooks/useTenantForm";
import { useCreateTenant } from "../hooks/useCreateTenant";
import { toast } from "sonner";
import type { TenantFormValues } from "../../../../schemas/tenant.schema";
import { formatDateToISO } from "../../../../utils/date";
import { getFirstFormErrorMessage } from "../../../../utils/formError";

interface TenantCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTenantId?: number) => void;
}

export default function TenantCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: TenantCreateModalProps) {
  const form = useTenantForm();
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const createMutation = useCreateTenant();
  const loading = createMutation.isPending;

  // Xử lý đóng modal và reset form sạch sẽ
  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      reset({
        full_name: "",
        citizen_id: "",
        date_of_birth: "",
        address: "",
        email: "",
        phone: "",
      });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: TenantFormValues) => {
    const payload = {
      full_name: data.full_name.trim(),
      citizen_id: data.citizen_id.trim(),
      date_of_birth: data.date_of_birth || null,
      address: data.address?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    };

    createMutation.mutate(payload, {
      onSuccess: (newTenant) => {
        const username = newTenant.user?.username ?? newTenant.full_name;
        toast.success(
          `Đã tự động tạo tài khoản "${username}" (mật khẩu mặc định: 123123) cho người thuê mới!`
        );
        handleClose();
        onSuccess(newTenant.id);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string; error?: string } } };
        const msg = err.response?.data?.message || err.response?.data?.error || "Không thể tạo người thuê";
        toast.error(msg);
      },
    });
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    const firstMsg = getFirstFormErrorMessage(fieldErrors);
    toast.error(firstMsg || "Vui lòng kiểm tra và điền đầy đủ các thông tin người thuê!");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOutsideClick={!loading}
      title="Thêm người thuê mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" form="tenant-create-form" isLoading={loading}>
            Lưu thông tin
          </Button>
        </>
      }
    >
      <form id="tenant-create-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input
              label="Họ tên *"
              placeholder="Nhập họ tên"
              error={errors.full_name?.message}
              {...register("full_name")}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="CCCD *"
              placeholder="Nhập số CCCD"
              error={errors.citizen_id?.message}
              {...register("citizen_id")}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Ngày sinh</label>
            <Controller
              control={control}
              name="date_of_birth"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
                    field.onChange(date ? formatDateToISO(date) : "");
                  }}
                  placeholder="Chọn ngày sinh..."
                />
              )}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Email"
              placeholder="Nhập email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
          <div className="col-span-12">
            <Input
              label="Địa chỉ"
              placeholder="Nhập địa chỉ"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
