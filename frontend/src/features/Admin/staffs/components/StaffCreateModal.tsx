import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useStaffForm } from "../hooks/useStaffForm";
import { useCreateStaff } from "../hooks/useCreateStaff";
import * as buildingService from "../../../../services/buildingService";
import * as authService from "../../../../services/authService";
import * as staffService from "../../../../services/staffService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { toast } from "sonner";
import type { StaffFormValues } from "../../../../schemas/staff.schema";

interface StaffCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POSITIONS = ["Quản lý", "Bảo vệ", "Vệ sinh", "Kỹ thuật", "Kế toán"];

export default function StaffCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: StaffCreateModalProps) {
  const form = useStaffForm();
  const { register, control, handleSubmit, reset, watch, formState: { errors } } = form;

  const createMutation = useCreateStaff();
  const saving = createMutation.isPending;

  const positionVal = watch("position");

  // Load buildings
  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
    enabled: isOpen,
  });
  const buildings = buildingsRes?.data || [];

  // Load existing staff list for checking managers
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllStaffs(),
    enabled: isOpen,
  });
  const staffList = staffRes?.data || [];

  // Load users to compute next username
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => authService.getAllUsers(),
    enabled: isOpen,
  });

  const [nextUsername, setNextUsername] = useState("");

  useEffect(() => {
    if (isOpen) {
      reset({
        fullName: "",
        phone: "",
        position: "Quản lý",
        buildingId: null,
      });
    }
  }, [isOpen, reset]);

  // Compute next username automatically
  useEffect(() => {
    if (users.length > 0) {
      const isManager = positionVal === "Quản lý";
      const prefix = isManager ? "quanly" : "nhanvien";
      const filteredUsers = users.filter((u) => u.username && u.username.startsWith(prefix));
      let nextIndex = 1;
      if (filteredUsers.length > 0) {
        const indices = filteredUsers.map((u) => {
          const match = u.username!.match(new RegExp(`^${prefix}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        });
        nextIndex = Math.max(...indices, 0) + 1;
      }
      setNextUsername(`${prefix}${nextIndex}`);
    } else {
      setNextUsername("");
    }
  }, [positionVal, users]);

  // ID các tòa nhà đã có Quản lý
  const managedBuildingIds = staffList
    .filter((s: any) => s.position === "Quản lý" && s.building_id)
    .map((s: any) => s.building_id as number);

  const onSubmit = (data: StaffFormValues) => {
    const isActor = data.position === "Quản lý" || data.position === "Kỹ thuật";

    createMutation.mutate(
      {
        full_name: data.fullName,
        phone: data.phone || null,
        position: data.position,
        building_id: data.buildingId ? Number(data.buildingId) : null,
      },
      {
        onSuccess: async (res) => {
          if (!isActor && res.user?.id) {
            try {
              // Delete the auto-created user if they aren't manager/tech
              await authService.deleteUser(res.user.id);
            } catch (e) {
              console.error("Không thể xóa tài khoản nhân viên", e);
            }
          }

          if (isActor) {
            const username = res.user?.username || nextUsername;
            toast.success(`Đã tự động cấp tài khoản "${username}" và thêm nhân viên thành công!`);
          } else {
            toast.success(`Đã thêm nhân viên "${res.full_name}" thành công.`);
          }

          onSuccess();
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } } };
          toast.error(err.response?.data?.error || err.response?.data?.message || "Không thể thêm nhân viên");
        },
      }
    );
  };

  const loading = loadingBuildings || loadingStaff || loadingUsers;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm nhân viên mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving} disabled={loading}>Thêm mới</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6">
              <Input
                label="Họ tên *"
                placeholder="Nhập họ tên"
                error={errors.fullName?.message}
                {...register("fullName")}
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
            <div className="col-span-12 sm:col-span-6">
              <Controller
                control={control}
                name="position"
                render={({ field, fieldState: { error } }) => (
                  <Combobox
                    label="Chức vụ *"
                    options={POSITIONS.map((pos) => ({ value: pos, label: pos }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn chức vụ"
                    searchable={false}
                    triggerClassName="rounded-md"
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Controller
                control={control}
                name="buildingId"
                render={({ field, fieldState: { error } }) => (
                  <Combobox
                    label="Tòa nhà làm việc"
                    options={buildings.map((b) => {
                      const isAlreadyManaged = positionVal === "Quản lý" && managedBuildingIds.includes(b.id);
                      return {
                        value: String(b.id),
                        label: `${b.branch_name} ${isAlreadyManaged ? "(Đã có Quản lý)" : ""}`,
                        disabled: isAlreadyManaged,
                      };
                    })}
                    value={field.value ? String(field.value) : ""}
                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                    placeholder="-- Chưa gán tòa nhà --"
                    triggerClassName="rounded-md"
                    clearable={true}
                    error={error?.message}
                  />
                )}
              />
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
