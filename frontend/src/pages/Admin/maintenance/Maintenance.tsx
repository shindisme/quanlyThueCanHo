import { useState } from "react";
import { Wrench, ClipboardList } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/PageHeader";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { removeVietnameseTones } from "../../../utils/string";
import { useAdminMaintenance } from "../../../hooks/admin/useAdminMaintenance";
import MaintenanceList from "./components/MaintenanceList";
import MaintenanceAssignModal from "./components/MaintenanceAssignModal";
import MaintenanceUnableModal from "./components/MaintenanceUnableModal";
import MaintenanceDetailModal from "./components/MaintenanceDetailModal";
import { useSort } from "../../../hooks/common/useSort";

export default function Maintenance() {
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
    loading,
    loadingStaff,
    role,

    // Assign Modal
    showAssignModal,
    setShowAssignModal,
    assignedStaffId,
    setAssignedStaffId,
    scheduledAt,
    setScheduledAt,
    handleOpenAssign,
    handleConfirm,

    // Unable Modal
    showUnableModal,
    setShowUnableModal,
    unableReason,
    setUnableReason,
    handleOpenUnable,
    handleUnableSubmit,

    // Actions
    handleComplete,
    saving,
  } = useAdminMaintenance();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);

  const handleOpenDetail = (req: any) => {
    setDetailRequest(req);
    setShowDetailModal(true);
  };

  const filteredRequests = requests.filter((r) => {
    const term = removeVietnameseTones(search.toLowerCase());
    const titleNorm = removeVietnameseTones(r.title.toLowerCase());
    const tenantName = removeVietnameseTones(r.tenant?.full_name?.toLowerCase() || "");
    const roomNorm = removeVietnameseTones(r.apartment?.room_number?.toLowerCase() || "");
    return titleNorm.includes(term) || tenantName.includes(term) || roomNorm.includes(term);
  });

  const { items: sortedRequests, requestSort, getSortIcon } = useSort(filteredRequests);

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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm kiếm..."
            className="w-64 sm:w-80 flex-1 min-w-0"
          />
        }
      />

      {/* Tìm kiếm v filter */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">

        <Combobox
          options={[
            { value: "PENDING", label: "Chờ xử lý" },
            { value: "PROCESSING", label: "Đang sửa chữa" },
            { value: "DONE", label: "Hoàn thành" },
            { value: "NEEDS_RESCHEDULE", label: "Báo không sửa được" },
            { value: "CANCELLED", label: "Đã hủy" }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Tất cả trạng thái"
          searchable={false}
          className="flex-1 min-w-0 w-full font-sans"
          triggerClassName="h-[42px]  border-gray-300 px-4 py-2.5 rounded-xl"
          clearable={true}
        />

        <Combobox
          options={[
            { value: "LOW", label: "Thấp" },
            { value: "MEDIUM", label: "Trung bình" },
            { value: "HIGH", label: "Khẩn cấp" }
          ]}
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="Tất cả độ ưu tiên"
          searchable={false}
          className="flex-1 min-w-0 w-full font-sans"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />

        {role === "ADMIN" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={buildingFilter}
            onChange={setBuildingFilter}
            placeholder="Tất cả tòa nhà"
            className="flex-1 min-w-0 w-full font-sans"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
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
          onComplete={handleComplete}
          requestSort={requestSort}
          getSortIcon={getSortIcon}
        />
      )}

      {/* Modal phân công */}
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

      {/* Modal Báo cáo không sửa được */}
      <MaintenanceUnableModal
        isOpen={showUnableModal}
        onClose={() => setShowUnableModal(false)}
        saving={saving}
        unableReason={unableReason}
        setUnableReason={setUnableReason}
        onUnableSubmit={handleUnableSubmit}
      />

      {/* Modal Xem Chi Tiết */}
      <MaintenanceDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        detailRequest={detailRequest}
        role={role}
      />
    </div>
  );
}
