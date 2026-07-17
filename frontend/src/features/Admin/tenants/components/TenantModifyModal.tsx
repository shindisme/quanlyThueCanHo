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

    updateMutation.mutate(
      {
        id: editItem.id,
        data: {
          full_name: data.full_name,
          citizen_id: data.citizen_id,
          date_of_birth: data.date_of_birth ? data.date_of_birth : null,
          address: data.address || null,
          email: data.email?.trim() || null,
          phone: data.phone?.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật thông tin người thuê thành công");
          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(err.response?.data?.message || "Cập nhật thất bại");
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin người thuê"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={loading}>Cập nhật</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    if (!date) {
                      field.onChange("");
                      return;
                    }
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    field.onChange(`${y}-${m}-${d}`);
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
