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

interface UseStaffCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  positions: string[];
}

export function useStaffCreate({ isOpen, onClose, onSuccess, positions }: UseStaffCreateProps) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async ({ full_name, phone, position, building_id }: {
      username: string;
      role: "MANAGER" | "STAFF";
      full_name: string;
      phone: string | null;
      position: string;
      building_id: number | null;
    }) => {
      const res = await staffService.createStaff({
        full_name,
        phone,
        position,
        building_id,
      });
      return { username: res.user?.username || "" };
    },
    onSuccess: (data) => {
      toast.success(`Đã tự động cấp tài khoản "${data.username}"và thêm nhân viên thành công!`);
      setFullName("");
      setPhone("");
      setPosition(positions[0]);
      setBuildingId("");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err.response?.data?.error || err.response?.data?.message || "Không thể thêm nhân viên");
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
    if (users.length > 0) {
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
  }, [position, users]);

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

    const isManager = position === "Quản lý";
    const roleToCreate = isManager ? "MANAGER" : "STAFF";

    createMutation.mutate({
      username: nextUsername,
      role: roleToCreate,
      full_name: fullName,
      phone: phone || null,
      position,
      building_id: buildingId ? Number(buildingId) : null,
    });
  }

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
    saving: createMutation.isPending,
    nextUsername,
    handleSave,
    managedBuildingIds,
  };
}
