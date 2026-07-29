import { useState } from "react";
import { Wrench, ClipboardList } from "lucide-react";
import SearchInput from "../../../../components/ui/SearchInput";
import PageHeader from "../../../../components/PageHeader";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { removeVietnameseTones } from "../../../../utils/string";
import { useSort } from "../../../../hooks/useSort";
import { useAdminMaintenance } from "../hooks/useAdminMaintenance";
import MaintenanceList from "../components/MaintenanceList";
import MaintenanceAssignModal from "../components/MaintenanceAssignModal";
import MaintenanceUnableModal from "../components/MaintenanceUnableModal";
import MaintenanceCompleteModal from "../components/MaintenanceCompleteModal";
import MaintenanceDetailModal from "../components/MaintenanceDetailModal";

import type { MaintenanceRequest } from "../../../../types";

export default function MaintenancePage() {
  const {
    requests,
    buildings,
    technicians,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    buildingFilter,
    setBuildingFilter,
    floorFilter,
    setFloorFilter,
    availableFloors,
    loading,
    loadingStaff,
    role,
    showAssignModal,
    setShowAssignModal,
    assignedStaffId,
    setAssignedStaffId,
    scheduledAt,
    setScheduledAt,
    handleOpenAssign,
    handleConfirm,
    showUnableModal,
    setShowUnableModal,
    unableReason,
    setUnableReason,
    handleOpenUnable,
    handleUnableSubmit,
    showCompleteModal,
    setShowCompleteModal,
    chargeTenant,
    setChargeTenant,
    repairFee,
    setRepairFee,
    handleOpenComplete,
    handleCompleteSubmit,
    saving,
  } = useAdminMaintenance();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState<MaintenanceRequest | null>(null);

  const handleOpenDetail = (req: MaintenanceRequest) => {
    setDetailRequest(req);
    setShowDetailModal(true);
  };

  const filteredRequests = requests.filter((r) => {
    const term = removeVietnameseTones(search.toLowerCase());
    const titleNorm = removeVietnameseTones(r.title.toLowerCase());
    const tenantName = removeVietnameseTones(r.tenant?.full_name?.toLowerCase() || "");
    const roomNorm = removeVietnameseTones(r.apartment?.room_number?.toLowerCase() || "");
    const matchSearch = !search || titleNorm.includes(term) || tenantName.includes(term) || roomNorm.includes(term);

    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchPriority = !priorityFilter || r.priority === priorityFilter;
    const matchBuilding = !buildingFilter || r.apartment?.building_id === Number(buildingFilter) || r.apartment?.building?.id === Number(buildingFilter);
    const matchFloor = !floorFilter || r.apartment?.floor === Number(floorFilter);

    return matchSearch && matchStatus && matchPriority && matchBuilding && matchFloor;
  });

  const { items: sortedRequests } = useSort(filteredRequests);

  return loading ? (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner size={36} />
      <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách yêu cầu sửa chữa...</span>
    </div>
  ) : (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Quản lý sửa chữa"
        subtitle="Tiếp nhận, phân công nhân viên kỹ thuật và giám sát quá trình xử lý sự cố thiết bị"
        count={requests.length}
        iconColor="linear-gradient(135deg, #EC4899, #F472B6)"
        actions={
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="w-64 sm:w-80 flex-1 min-w-0" />
        }
      />

      <div className="grid grid-cols-12 gap-4 font-sans">
        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={[
              { value: "PENDING", label: "Chờ xử lý" },
              { value: "PROCESSING", label: "Đang sửa chữa" },
              { value: "DONE", label: "Hoàn thành" },
              { value: "NEEDS_RESCHEDULE", label: "Báo không sửa được" },
              { value: "CANCELLED", label: "Đã hủy" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tất cả trạng thái"
            searchable={false}
            triggerClassName="h-[42px] border-gray-200 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={[
              { value: "LOW", label: "Thấp" },
              { value: "MEDIUM", label: "Trung bình" },
              { value: "HIGH", label: "Khẩn cấp" },
            ]}
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="Tất cả độ ưu tiên"
            searchable={false}
            triggerClassName="h-[42px] border-gray-200 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={availableFloors.map((fl) => ({ value: String(fl), label: `Tầng ${fl}` }))}
            value={floorFilter}
            onChange={setFloorFilter}
            placeholder="Tất cả tầng"
            triggerClassName="h-[42px] border-gray-200 rounded-xl"
            clearable={true}
          />
        </div>

        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingFilter}
              onChange={(val) => {
                setBuildingFilter(val);
                setFloorFilter("");
              }}
              placeholder="Tất cả chi nhánh"
              triggerClassName="h-[42px] border-gray-200 rounded-xl"
              clearable={true}
            />
          </div>
        )}
      </div>

      {sortedRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-md">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy yêu cầu sửa chữa nào</p>
        </div>
      ) : (
        <MaintenanceList
          requests={sortedRequests}
          role={role}
          saving={saving}
          onOpenDetail={handleOpenDetail}
          onOpenAssign={handleOpenAssign}
          onOpenUnable={handleOpenUnable}
          onComplete={handleOpenComplete}
        />
      )}

      <MaintenanceAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        loadingStaff={loadingStaff}
        saving={saving}
        technicians={technicians}
        assignedStaffId={assignedStaffId}
        setAssignedStaffId={setAssignedStaffId}
        scheduledAt={scheduledAt}
        setScheduledAt={setScheduledAt}
        onConfirm={handleConfirm}
      />

      <MaintenanceUnableModal
        isOpen={showUnableModal}
        onClose={() => setShowUnableModal(false)}
        saving={saving}
        unableReason={unableReason}
        setUnableReason={setUnableReason}
        onUnableSubmit={handleUnableSubmit}
      />

      <MaintenanceCompleteModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        saving={saving}
        chargeTenant={chargeTenant}
        setChargeTenant={setChargeTenant}
        repairFee={repairFee}
        setRepairFee={setRepairFee}
        onCompleteSubmit={handleCompleteSubmit}
      />

      <MaintenanceDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} detailRequest={detailRequest} role={role} />
    </div>
  );
}
