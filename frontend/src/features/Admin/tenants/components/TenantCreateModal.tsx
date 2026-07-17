import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { useTenantForm } from "../hooks/useTenantForm";
import { useCreateTenant } from "../hooks/useCreateTenant";
import * as tenantService from "../../../../services/tenantService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { toast } from "sonner";
import type { TenantFormValues } from "../../../../schemas/tenant.schema";

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

  // Load existing tenants for duplicate checks
  const { data: tenantsRes } = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
    enabled: isOpen,
  });
  const allTenants = tenantsRes?.data || [];

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
    const finalPhone = data.phone || null;
    const finalEmail = data.email || null;
    const cleanCitizenId = data.citizen_id;

    if (finalPhone) {
      const dup = allTenants.find((t) => t.phone === finalPhone);
      if (dup) {
        toast.error("Số điện thoại này đã tồn tại trong hệ thống.");
        return;
      }
    }

    if (finalEmail) {
      const dup = allTenants.find(
        (t) => t.email && t.email.toLowerCase() === finalEmail.toLowerCase()
      );
      if (dup) {
        toast.error("Email này đã tồn tại trong hệ thống.");
        return;
      }
    }

    if (cleanCitizenId) {
      const dup = allTenants.find((t) => t.citizen_id === cleanCitizenId);
      if (dup) {
        toast.error("Số CCCD này đã tồn tại trong hệ thống.");
        return;
      }
    }

    createMutation.mutate(
      {
        full_name: data.full_name,
        citizen_id: data.citizen_id,
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        email: finalEmail,
        phone: finalPhone,
      },
      {
        onSuccess: (newTenant) => {
          const username = newTenant.user?.username || newTenant.full_name;
          toast.success(
            `Đã tự động tạo tài khoản "${username}" (mật khẩu mặc định: 123123) cho người thuê mới!`
          );
          onSuccess(newTenant.id);
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { message?: string; response?: { data?: { message?: string } } };
          toast.error(err.message || err.response?.data?.message || "Không thể tạo người thuê");
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm người thuê mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={loading}>Lưu thông tin</Button>
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
