import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as notificationService from "../../services/notificationService";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import { useOnOff } from "../common/useOnOff";
import { useUserRole } from "../common/useUserRole";

export function useNotificationSend() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Form states
  const [buildingId, setBuildingId] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("GENERAL");

  // Advanced targeting
  const [targetType, setTargetType] = useState<"BUILDING" | "APARTMENTS">("BUILDING");
  const [selectedApartmentIds, setSelectedApartmentIds] = useState<number[]>([]);

  const broadcastModal = useOnOff();

  // Fetch buildings
  const { data: buildingsRes } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings(),
    enabled: role === "ADMIN",
  });
  const buildings = buildingsRes?.data || [];

  // Fetch apartments 
  const { data: apartmentsRes, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments-for-target", buildingId],
    queryFn: () =>
      apartmentService.getAllApartments({
        building_id: buildingId,
        limit: 100,
      }),
    enabled: !!buildingId && targetType === "APARTMENTS",
  });
  const apartments = apartmentsRes?.data || [];

  // Reset selected apartments if building changes
  useEffect(() => {
    setSelectedApartmentIds([]);
  }, [buildingId]);

  // Mutation
  const sendMutation = useMutation({
    mutationFn: (payload: notificationService.SendBuildingNotificationPayload) =>
      notificationService.sendBuildingNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Phát sóng thông báo thành công!");
      broadcastModal.onClose();
      // Reset form
      setTitle("");
      setContent("");
      setSelectedApartmentIds([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Phát sóng thông báo thất bại");
    },
  });

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      toast.error("Vui lòng chọn tòa nhà!");
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error("Tiêu đề và nội dung không được bỏ trống!");
      return;
    }

    const payload: notificationService.SendBuildingNotificationPayload = {
      building_id: Number(buildingId),
      title: title.trim(),
      content: content.trim(),
      type,
    };

    if (targetType === "APARTMENTS") {
      if (selectedApartmentIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một căn hộ!");
        return;
      }
      payload.apartment_ids = selectedApartmentIds;
    }

    sendMutation.mutate(payload);
  };

  const handleToggleApartment = (id: number) => {
    setSelectedApartmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return {
    role,
    buildings,
    apartments,
    loadingApartments,
    title,
    setTitle,
    content,
    setContent,
    type,
    setType,
    buildingId,
    setBuildingId,
    targetType,
    setTargetType,
    selectedApartmentIds,
    setSelectedApartmentIds,
    handleToggleApartment,
    broadcastModal,
    handleBroadcastSubmit,
    isSending: sendMutation.isPending,
  };
}
