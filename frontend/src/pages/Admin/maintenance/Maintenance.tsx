import { Wrench, ClipboardList, Check, AlertCircle, Calendar, ShieldAlert } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/PageHeader";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { formatDate } from "../../../utils/date";
import { removeVietnameseTones } from "../../../utils/string";
import { useAdminMaintenance } from "../../../hooks/useAdminMaintenance";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

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

  const filteredRequests = requests.filter((r) => {
    const term = removeVietnameseTones(search.toLowerCase());
    const titleNorm = removeVietnameseTones(r.title.toLowerCase());
    const tenantName = removeVietnameseTones(r.tenant?.full_name?.toLowerCase() || "");
    const roomNorm = removeVietnameseTones(r.apartment?.room_number?.toLowerCase() || "");
    return titleNorm.includes(term) || tenantName.includes(term) || roomNorm.includes(term);
  });

  function getStatusBadge(status: string) {
    if (status === "PENDING") return <Badge variant="warning">Chờ xử lý</Badge>;
    if (status === "PROCESSING") return <Badge variant="info">Đang sửa chữa</Badge>;
    if (status === "DONE") return <Badge variant="success">Hoàn thành</Badge>;
    if (status === "NEEDS_RESCHEDULE") return <Badge variant="danger">Báo không sửa được</Badge>;
    return <Badge variant="gray">Đã hủy</Badge>;
  }

  function getPriorityBadge(priority: string) {
    if (priority === "HIGH") return <Badge variant="danger">Khẩn cấp</Badge>;
    if (priority === "MEDIUM") return <Badge variant="warning">Trung bình</Badge>;
    return <Badge variant="gray">Thấp</Badge>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Quản lý sửa chữa"
        subtitle="Tiếp nhận, phân công nhân viên kỹ thuật và giám sát quá trình xử lý sự cố thiết bị"
        count={requests.length}
        iconColor="linear-gradient(135deg, #EC4899, #F472B6)"
      />

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tiêu đề, người thuê, phòng..."
            className="w-full"
          />

          <Combobox
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "PENDING", label: "Chờ xử lý" },
              { value: "PROCESSING", label: "Đang sửa chữa" },
              { value: "DONE", label: "Hoàn thành" },
              { value: "NEEDS_RESCHEDULE", label: "Báo không sửa được" },
              { value: "CANCELLED", label: "Đã hủy" }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            searchable={false}
            className="w-full"
          />

          <Combobox
            options={[
              { value: "", label: "Tất cả độ ưu tiên" },
              { value: "LOW", label: "Thấp" },
              { value: "MEDIUM", label: "Trung bình" },
              { value: "HIGH", label: "Khẩn cấp" }
            ]}
            value={priorityFilter}
            onChange={setPriorityFilter}
            searchable={false}
            className="w-full"
          />

          {role === "ADMIN" && (
            <Combobox
              options={[
                { value: "", label: "Tất cả tòa nhà" },
                ...buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))
              ]}
              value={buildingFilter}
              onChange={setBuildingFilter}
              className="w-full"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải danh sách sự cố...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy yêu cầu sửa chữa nào</p>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-hidden bg-white shadow-sm rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Tòa nhà & Phòng</TableHead>
                <TableHead>Người gửi</TableHead>
                <TableHead>Sự cố</TableHead>
                <TableHead>Nhân viên kỹ thuật</TableHead>
                <TableHead className="text-center">Hẹn sửa</TableHead>
                <TableHead className="text-center">Độ ưu tiên</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const buildingName = req.apartment?.building?.branch_name || "Chưa rõ";
                const roomNum = req.apartment?.room_number ? `P.${req.apartment.room_number}` : "Chưa rõ";
                const showAssignBtn = (role === "ADMIN" || role === "MANAGER") && req.status === "PENDING";
                const showStaffActions = role === "STAFF" && req.status === "PROCESSING";

                return (
                  <TableRow key={req.id}>
                    <TableCell className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</TableCell>
                    <TableCell className="font-medium text-gray-800 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{roomNum}</span>
                        <span className="text-xs text-gray-400 font-normal">{buildingName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">{req.tenant?.full_name || "Không rõ"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div className="flex flex-col max-w-xs">
                        <span className="font-semibold text-primary-600">{req.title}</span>
                        <span className="text-xs text-gray-400 truncate" title={req.description}>
                          {req.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 whitespace-nowrap">
                      {req.assigned_staff ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{req.assigned_staff.full_name}</span>
                          <span className="text-xs text-gray-400">{req.assigned_staff.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa phân công</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-gray-600 text-xs whitespace-nowrap">
                      {req.scheduled_at ? formatDate(req.scheduled_at) : "-"}
                    </TableCell>
                    <TableCell className="text-center">{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {getStatusBadge(req.status)}
                        {req.status === "NEEDS_RESCHEDULE" && req.unable_reason && (
                          <span className="text-[10px] text-red-500 font-medium max-w-[120px] truncate" title={req.unable_reason}>
                            Lý do: {req.unable_reason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {showAssignBtn && (
                        <button
                          onClick={() => handleOpenAssign(req)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center gap-1.5 text-xs font-semibold cursor-pointer inline-flex disabled:opacity-50"
                        >
                          <Calendar size={14} /> Phân công
                        </button>
                      )}

                      {showStaffActions && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleComplete(req.id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            title="Hoàn thành sửa"
                          >
                            <Check size={14} /> Hoàn thành
                          </button>
                          <button
                            onClick={() => handleOpenUnable(req)}
                            disabled={saving}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            title="Báo cáo không sửa được"
                          >
                            <ShieldAlert size={14} /> Không sửa được
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal phân công */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Xác Nhận & Phân Công Sửa Chữa">
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Nhân viên kỹ thuật phụ trách</label>
            <Combobox
              options={[
                { value: "", label: "Chọn nhân viên kỹ thuật" },
                ...technicians.map((t) => ({ value: String(t.id), label: `${t.full_name} (${t.position})` }))
              ]}
              value={assignedStaffId}
              onChange={setAssignedStaffId}
              className="w-full"
              disabled={saving}
            />
          </div>

          <Input
            label="Thời gian hẹn sửa chữa"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            disabled={saving}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setShowAssignModal(false)} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving}>Xác nhận & Giao việc</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Báo cáo không sửa được */}
      <Modal isOpen={showUnableModal} onClose={() => setShowUnableModal(false)} title="Báo Cáo Không Thể Sửa Chữa">
        <form onSubmit={handleUnableSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> Lý do kỹ thuật / Cản trở không thể sửa
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
              value={unableReason}
              onChange={(e) => setUnableReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: thiếu linh kiện thay thế, cần gọi dịch vụ hãng...)"
              required
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setShowUnableModal(false)} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" type="submit" disabled={saving}>
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
