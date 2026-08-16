import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as staffService from "../../../../services/staffService";
import * as authService from "../../../../services/authService";
import { queryKeys } from "../../../../constants/queryKeys";
import { ACCOUNT_POSITIONS } from "../../../../constants/staff";

interface UseStaffFormFieldsProps {
  isOpen: boolean;
  positionVal?: string;
  currentStaffId?: number;
  currentUserId?: number | null;
}

export function useStaffFormFields({
  isOpen,
  positionVal = "",
  currentStaffId,
  currentUserId,
}: UseStaffFormFieldsProps) {
  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAll({ limit: 100 }),
    enabled: isOpen,
  });
  const buildings = useMemo(() => buildingsRes?.data || [], [buildingsRes?.data]);

  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: () => staffService.getAll(),
    enabled: isOpen,
  });
  const staffList = useMemo(() => staffRes?.data || [], [staffRes?.data]);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => authService.getAllPage(),
    enabled: isOpen,
    select: (res) => res.data,
  });

  const managedBuildingIds = useMemo(() => {
    return staffList
      .filter((s) => s.position === "Quản lý" && s.building_id && s.id !== currentStaffId)
      .map((s) => s.building_id as number);
  }, [staffList, currentStaffId]);

  const nextUsername = useMemo(() => {
    if (!ACCOUNT_POSITIONS.some((position) => position === positionVal) || (currentUserId && positionVal === "Quản lý")) {
      return "";
    }

    const isManager = positionVal === "Quản lý";
    const prefix = isManager ? "quanly" : "nhanvien";
    const filteredUsers = users.filter((u) => u.username && u.username.startsWith(prefix));

    if (filteredUsers.length === 0) return `${prefix}1`;

    const indices = filteredUsers.map((u) => {
      const match = u.username!.match(new RegExp(`^${prefix}(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    });

    const nextIndex = Math.max(...indices, 0) + 1;
    return `${prefix}${nextIndex}`;
  }, [positionVal, users, currentUserId]);

  const loading = loadingBuildings || loadingStaff || loadingUsers;

  return {
    buildings,
    staffList,
    users,
    managedBuildingIds,
    nextUsername,
    loading,
  };
}
