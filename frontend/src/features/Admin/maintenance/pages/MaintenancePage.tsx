import { useState, useMemo } from "react";
import { ClipboardList } from "lucide-react";
import SearchInput from "../../../../components/ui/SearchInput";
import PageHeader from "../../../../components/layout/PageHeader";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { removeVietnameseTones } from "../../../../utils/string";
import { useSort } from "../../../../hooks/useSort";
import { useMaintenancePage } from "../hooks/useMaintenancePage";
import { useMaintenanceDetail } from "../hooks/useMaintenanceDetail";
import MaintenanceList from "../components/MaintenanceList";
import MaintenanceAssignModal from "../components/MaintenanceAssignModal";
import MaintenanceUnableModal from "../components/MaintenanceUnableModal";
import MaintenanceCompleteModal from "../components/MaintenanceCompleteModal";
import MaintenanceDetailModal from "../components/MaintenanceDetailModal";

export default function MaintenancePage() {
  const {
    requests,
    buildings,
    technicians,
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
    saving,
    role,
    assign,
    complete,
    unable,
  } = useMaintenancePage();

  const detail = useMaintenanceDetail();
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const term = removeVietnameseTones(search.toLowerCase());
      const titleNorm = removeVietnameseTones(r.title.toLowerCase());
      const tenantName = removeVietnameseTones(r.tenant?.full_name?.toLowerCase() || "");
      const roomNorm = removeVietnameseTones(r.apartment?.room_number?.toLowerCase() || "");
      const matchSearch = !search || titleNorm.includes(term) || tenantName.includes(term) || roomNorm.includes(term);

      const matchFloor = !floorFilter || r.apartment?.floor === Number(floorFilter);
      return matchSearch && matchFloor;
    });
  }, [requests, search, floorFilter]);

  const { items: sortedRequests } = useSort(filteredRequests);

  return loading ? (
    <div className="flex flex-col items-center justify-center min-h-100">
      <LoadingSpinner size={36} />
      <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách yêu cầu sửa chữa...</span>
    </div>
  ) : (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Quản lý sửa chữa"
        subtitle="Tiếp nhận, phân công nhân viên kỹ thuật và giám sát quá trình xử lý sự cố thiết bị"
        count={requests.length}
        actions={
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="w-64 sm:w-80 flex-1 min-w-0" />
        }
      />

      <div className="grid grid-cols-12 gap-4">
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
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-sm rounded-xl">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy yêu cầu sửa chữa nào</p>
        </div>
      ) : (
        <MaintenanceList
          requests={sortedRequests}
          role={role}
          saving={saving}
          onOpenDetail={detail.openModal}
          onOpenAssign={assign.openModal}
          onOpenUnable={unable.openModal}
          onComplete={complete.openModal}
        />
      )}

      <MaintenanceAssignModal
        isOpen={assign.isOpen}
        onClose={assign.closeModal}
        loadingStaff={loadingStaff}
        saving={saving}
        technicians={technicians}
        assignedStaffId={assign.assignedStaffId}
        setAssignedStaffId={assign.setAssignedStaffId}
        scheduledAt={assign.scheduledAt}
        setScheduledAt={assign.setScheduledAt}
        onConfirm={assign.handleConfirm}
      />

      <MaintenanceUnableModal
        isOpen={unable.isOpen}
        onClose={unable.closeModal}
        saving={saving}
        unableReason={unable.unableReason}
        setUnableReason={unable.setUnableReason}
        onUnableSubmit={unable.handleUnableSubmit}
      />

      <MaintenanceCompleteModal
        isOpen={complete.isOpen}
        onClose={complete.closeModal}
        saving={saving}
        chargeTenant={complete.chargeTenant}
        setChargeTenant={complete.setChargeTenant}
        repairFee={complete.repairFee}
        setRepairFee={complete.setRepairFee}
        onCompleteSubmit={complete.handleCompleteSubmit}
      />

      <MaintenanceDetailModal
        isOpen={detail.isOpen}
        onClose={detail.closeModal}
        detailRequest={detail.detailRequest}
        role={role}
        onUpdatePriority={(_id, priority) => detail.updatePriority(priority)}
      />
    </div>
  );
}
