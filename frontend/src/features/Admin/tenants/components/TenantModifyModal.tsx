import { useEffect } from "react";
import { Controller } from "react-hook-form";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { useTenantForm } from "../hooks/useTenantForm";
import { useUpdateTenant } from "../hooks/useUpdateTenant";
import type { Tenant } from "../../../../types";
import type { TenantFormValues } from "../../../../schemas/tenant.schema";
import { toast } from "sonner";

interface TenantModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Tenant | null;
}

// Hàm get thông báo lỗi đầu tiên từ object errors
function getFirstErrorMessage(errs: Record<string, any>): string | undefined {
  for (const key of Object.keys(errs)) {
    const err = errs[key];
    if (!err) continue;
    if (typeof err.message === "string") return err.message;
    if (typeof err === "object") {
      const nested = getFirstErrorMessage(err);
      if (nested) return nested;
    }
  }
  return undefined;
}

// Định dạng ngày Date sang chuỗi YYYY-MM-DD
const formatDateToISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function TenantModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: TenantModifyModalProps) {
  const form = useTenantForm();
  const { register, control, handleSubmit, reset, formState: { errors } } = form;

  const updateMutation = useUpdateTenant();
  const loading = updateMutation.isPending;

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (editItem && isOpen) {
      reset({
        full_name: editItem.full_name,
        citizen_id: editItem.citizen_id,
        date_of_birth: editItem.date_of_birth
          ? new Date(editItem.date_of_birth).toISOString().split("T")[0]
          : "",
        address: editItem.address || "",
        email: editItem.email || "",
        phone: editItem.phone || "",
      });
    }
  }, [editItem, isOpen, reset]);

  const onSubmit = (data: TenantFormValues) => {
    if (!editItem) return;

    const payload = {
      full_name: data.full_name.trim(),
      citizen_id: data.citizen_id.trim(),
      date_of_birth: data.date_of_birth || null,
      address: data.address?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    };

    updateMutation.mutate(
      {
        id: editItem.id,
        data: payload,
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật thông tin người thuê thành công");
          handleClose();
          onSuccess();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string; error?: string } } };
          const msg = err.response?.data?.message || err.response?.data?.error || "Cập nhật thất bại";
          toast.error(msg);
        },
      }
    );
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    const firstMsg = getFirstErrorMessage(fieldErrors);
    toast.error(firstMsg || "Vui lòng kiểm tra và điền đầy đủ các thông tin người thuê!");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : handleClose}
      title="Chỉnh sửa thông tin người thuê"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" form="tenant-modify-form" isLoading={loading}>
            Cập nhật
          </Button>
        </>
      }
    >
      <form id="tenant-modify-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
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
