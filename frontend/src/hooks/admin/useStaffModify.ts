import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as staffService from "../../services/staffService";
import * as buildingService from "../../services/buildingService";
import type { BuildingData } from "../../services/buildingService";
import * as authService from "../../services/authService";
import type { UserData } from "../../services/authService";
import type { Staff } from "../../types";
import { staffSchema } from "../../schemas/staff.schema";

interface UseStaffModifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Staff | null;
  positions: string[];
}

export function useStaffModify({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  positions,
}: UseStaffModifyProps) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async ({ id, fullName, phone, position, buildingId }: {
      id: number;
      fullName: string;
      phone: string | null;
      position: string;
      buildingId: number | "";
    }) => {
      if (!editItem) {
        throw new Error("Không tìm thấy thông tin nhân viên chỉnh sửa");
      }
      let initialPassword = "";
      let createdAccount = false;
      let deletedAccount = false;

      const isActor = position === "Quản lý" || position === "Kỹ thuật";

      // Nếu chưa có tài khoản, tự động tạo tài khoản nếu chức vụ mới cần tài khoản
      if (!editItem.user_id && isActor) {
        const isManager = position === "Quản lý";
        const roleToCreate = isManager ? "MANAGER" : "STAFF";

        const res = await authService.createUser({
          username: nextUsername,
          role: roleToCreate,
        });
        initialPassword = res.initial_password || "";
        createdAccount = true;
      }

      // Nếu đã có tài khoản từ trước nhưng chức vụ mới không cần tài khoản
      if (editItem.user_id && !isActor) {
        try {
          await authService.deleteUser(editItem.user_id);
          deletedAccount = true;
        } catch (e) {
          console.error("Không thể xóa tài khoản nhân viên", e);
        }
      }

      await staffService.updateStaff(id, {
        full_name: fullName,
        phone: phone || null,
        position,
        building_id: buildingId ? Number(buildingId) : null,
      });

      return { hasPriorUser: !!editItem.user_id, nextUsername, initialPassword, createdAccount, deletedAccount };
    },
    onSuccess: (data) => {
      if (data.createdAccount) {
        toast.success(`Đã tự động cấp tài khoản "${data.nextUsername}" cho vị trí mới! Mật khẩu: ${data.initialPassword || "123123"}`);
      } else if (data.deletedAccount) {
        toast.success("Đã cập nhật nhân viên và hủy tài khoản hệ thống.");
      } else {
        toast.success("Cập nhật thông tin nhân viên thành công!");
      }
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err.response?.data?.error || err.response?.data?.message || "Không thể cập nhật nhân viên");
    }
  });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState(positions[0]);
  const [buildingId, setBuildingId] = useState<number | "">("");

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextUsername, setNextUsername] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setFullName("");
      setPhone("");
      setPosition(positions[0]);
      setBuildingId("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (editItem && isOpen) {
      setFullName(editItem.full_name);
      setPhone(editItem.phone || "");
      setPosition(editItem.position);
      setBuildingId(editItem.building_id || "");
    }
  }, [editItem, isOpen]);

  useEffect(() => {
    if (users.length > 0 && editItem && !editItem.user_id) {
      const isManager = position === "Quản lý";
      const prefix = isManager ? "quanly" : "nhanvien";
      const filteredUsers = users.filter((u) => u.username.startsWith(prefix));
      let nextIndex = 1;
      if (filteredUsers.length > 0) {
        const indices = filteredUsers.map((u) => {
          const match = u.username.match(new RegExp(`^${prefix}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        });
        nextIndex = Math.max(...indices, 0) + 1;
      }
      setNextUsername(`${prefix}${nextIndex}`);
    } else {
      setNextUsername("");
    }
  }, [position, users, editItem]);

  async function fetchData() {
    try {
      setLoading(true);
      const bRes = await buildingService.getAllBuildings({ limit: 100 });
      setBuildings(bRes.data);
      const uRes = await authService.getAllUsers();
      setUsers(uRes);
      const sRes = await staffService.getAllStaff();
      setStaffList(sRes.data);
    } catch {
      toast.error("Không thể tải dữ liệu liên kết");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!editItem) return;

    const validation = staffSchema.safeParse({
      fullName,
      phone: phone || null,
      position,
      buildingId: buildingId || null,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    updateMutation.mutate({
      id: editItem.id,
      fullName,
      phone: phone || null,
      position,
      buildingId,
    });
  }

  // Danh sách ID các tòa nhà đã có Quản lý phụ trách
  const managedBuildingIds = staffList
    .filter((s) => s.position === "Quản lý" && s.building_id)
    .map((s) => s.building_id as number);

  const hasLinkedUser = !!(editItem && editItem.user_id);

  return {
    fullName,
    setFullName,
    phone,
    setPhone,
    position,
    setPosition,
    buildingId,
    setBuildingId,
    buildings,
    loading,
    saving: updateMutation.isPending,
    handleSave,
    managedBuildingIds,
    hasLinkedUser,
    nextUsername,
  };
}
