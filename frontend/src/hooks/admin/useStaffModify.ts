import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as staffService from "../../services/staffService";
import * as buildingService from "../../services/buildingService";
import type { BuildingData } from "../../services/buildingService";
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
      await staffService.updateStaff(id, {
        full_name: fullName,
        phone: phone || null,
        position,
        building_id: buildingId ? Number(buildingId) : null,
      });
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin nhân viên thành công!");
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
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

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

  async function fetchData() {
    try {
      setLoading(true);
      const bRes = await buildingService.getAllBuildings({ limit: 100 });
      setBuildings(bRes.data);
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
  };
}
