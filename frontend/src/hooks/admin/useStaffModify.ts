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
    mutationFn: async ({ id, fullName, phone, position, buildingId, editItem, nextUsername }: {
      id: number;
      fullName: string;
      phone: string | null;
      position: string;
      buildingId: number | "";
      editItem: Staff;
      nextUsername: string;
    }) => {
      let linkedUserId = editItem.user_id;
      let initialPassword = "";

      // Nếu chưa có tài khoản, tự động tạo tài khoản theo thứ tự dựa trên chức vụ mới
      if (!editItem.user_id) {
        const isManager = position === "Quản lý";
        const roleToCreate = isManager ? "MANAGER" : "STAFF";

        const res = await authService.createUser({
          username: nextUsername,
          role: roleToCreate,
        });
        linkedUserId = res.userId;
        initialPassword = (res as any).initial_password;
      }

      await staffService.updateStaff(id, {
        full_name: fullName,
        phone: phone || null,
        position,
        building_id: buildingId ? Number(buildingId) : null,
        user_id: linkedUserId,
      });

      return { hasPriorUser: !!editItem.user_id, nextUsername, initialPassword };
    },
    onSuccess: (data) => {
      if (!data.hasPriorUser) {
        toast.success(`Đã tự động cấp tài khoản "${data.nextUsername}" và cập nhật thành công! Mật khẩu khởi tạo: ${data.initialPassword || "123456"}`, { duration: 10000 });
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
      editItem,
      nextUsername,
    });
  }

  const hasLinkedUser = !!(editItem && editItem.user_id);

  // Danh sách ID các tòa nhà đã có Quản lý phụ trách
  const managedBuildingIds = staffList
    .filter((s) => s.position === "Quản lý" && s.building_id)
    .map((s) => s.building_id as number);

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
    nextUsername,
    handleSave,
    hasLinkedUser,
    managedBuildingIds,
  };
}
