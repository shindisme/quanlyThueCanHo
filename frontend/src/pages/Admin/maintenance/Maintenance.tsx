import { useState } from "react";
import { Wrench, ClipboardList, Check, AlertCircle, Calendar as CalendarIcon, ShieldAlert, Eye } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/PageHeader";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Combobox from "../../../components/ui/Combobox";
import Calendar from "../../../components/ui/Calendar";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { formatDate } from "../../../utils/date";
import { removeVietnameseTones } from "../../../utils/string";
import { useAdminMaintenance } from "../../../hooks/admin/useAdminMaintenance";
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
      />

      {/* Tìm kiếm v filter */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm kiếm..."
          className="flex-1 min-w-0 w-full"
        />

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
          className="flex-1 min-w-0 w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
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
          className="flex-1 min-w-0 w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />

        {role === "ADMIN" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={buildingFilter}
            onChange={setBuildingFilter}
            placeholder="Tất cả tòa nhà"
            className="flex-1 min-w-0 w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        )}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-sm">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy yêu cầu sửa chữa nào</p>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-hidden bg-white shadow-xl rounded-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Căn hộ</TableHead>
                <TableHead>Sự cố</TableHead>
                <TableHead>Nhân viên kỹ thuật</TableHead>
                <TableHead className="text-center">Hẹn sửa</TableHead>
                <TableHead className="text-center">Độ ưu tiên</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Chức năng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const buildingName = req.apartment?.building?.branch_name || "Chưa rõ";
                const roomNum = req.apartment?.room_number ? `P.${req.apartment.room_number}` : "Chưa rõ";
                const showAssignBtn = (role === "ADMIN" || role === "MANAGER") && (req.status === "PENDING" || req.status === "NEEDS_RESCHEDULE");
                const showStaffActions = role === "STAFF" && req.status === "PROCESSING";

                return (
                  <TableRow key={req.id}>
                    <TableCell className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</TableCell>
                    <TableCell className="font-medium text-gray-800 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{roomNum}</span>
                        {role === "ADMIN" && (
                          <span className="text-xs text-gray-400 font-normal">{buildingName}</span>
                        )}
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
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Chi tiết */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(req)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>

                        {showAssignBtn && (
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(req)}
                            disabled={saving}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer disabled:opacity-50 transition-colors"
                            title="Phân công sửa chữa"
                          >
                            <CalendarIcon size={16} />
                          </button>
                        )}

                        {showStaffActions && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleComplete(req.id)}
                              disabled={saving}
                              className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer disabled:opacity-50 transition-colors"
                              title="Hoàn thành sửa chữa"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenUnable(req)}
                              disabled={saving}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 transition-colors"
                              title="Báo cáo không sửa được"
                            >
                              <ShieldAlert size={16} />
                            </button>
                          </>
                        )}
                      </div>
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
        {loadingStaff ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size={36} />
            <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải...</span>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-650 mb-1 select-none">Nhân viên kỹ thuật phụ trách</label>
              <Combobox
                options={technicians.map((t) => ({ value: String(t.id), label: `${t.full_name} (${t.position})` }))}
                value={assignedStaffId}
                onChange={setAssignedStaffId}
                className="w-full"
                triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
                placeholder="Chọn nhân viên kỹ thuật"
                clearable={true}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-650 mb-1 select-none">Thời gian hẹn sửa chữa</label>
              <Calendar
                showTime={true}
                value={scheduledAt ? new Date(scheduledAt) : null}
                onChange={(date) => {
                  setScheduledAt(date ? date.toISOString() : "");
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setShowAssignModal(false)} disabled={saving}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={saving}>Xác nhận & Giao việc</Button>
            </div>
          </form>
        )}
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
              placeholder="Nhập lý do chi tiết"
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

      {/* Modal Xem Chi Tiết */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi Tiết Yêu Cầu Sửa Chữa" size="lg">
        {detailRequest && (
          <div className="space-y-6 text-sm font-sans">
            {/* Header / Basic info */}
            <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h4 className="text-base font-bold text-gray-900">{detailRequest.title}</h4>
                <p className="text-xs text-gray-400 mt-1">Ngày gửi: {formatDate(detailRequest.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(detailRequest.status)}
                {getPriorityBadge(detailRequest.priority)}
              </div>
            </div>

            {/* Room / Tenant info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-2">
                <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin phòng thuê</h5>
                <p><span className="font-semibold text-gray-600">Căn hộ:</span> P.{detailRequest.apartment?.room_number || "Chưa rõ"}</p>
                <p><span className="font-semibold text-gray-600">Tầng:</span> Tầng {detailRequest.apartment?.floor || "Chưa rõ"}</p>
                {role === "ADMIN" && (
                  <p><span className="font-semibold text-gray-600">Chi nhánh:</span> {detailRequest.apartment?.building?.branch_name || "Chưa rõ"}</p>
                )}
              </div>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-2">
                <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Người gửi yêu cầu</h5>
                <p><span className="font-semibold text-gray-600">Họ và tên:</span> {detailRequest.tenant?.full_name || "Chưa rõ"}</p>
                <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {detailRequest.tenant?.phone || "-"}</p>
                <p><span className="font-semibold text-gray-600">Email:</span> {detailRequest.tenant?.email || "-"}</p>
              </div>
            </div>

            {/* Description & Image */}
            <div className="space-y-2">
              <h5 className="font-bold text-gray-850 border-b border-gray-100 pb-1">Mô tả sự cố</h5>
              <div className="bg-white p-3 rounded-xl border border-gray-200 text-gray-700 min-h-[80px] whitespace-pre-wrap leading-relaxed">
                {detailRequest.description}
              </div>
              {detailRequest.image_url && (
                <div className="mt-3">
                  <span className="block text-xs font-semibold text-gray-400 mb-1.5">Hình ảnh đính kèm:</span>
                  <img
                    src={detailRequest.image_url}
                    alt="Hình ảnh sự cố thực tế"
                    className="max-w-md w-full max-h-[300px] object-contain rounded-xl border border-gray-200 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Assignment & Process Info */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-2">
              <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Phân công xử lý</h5>
              {detailRequest.assigned_staff ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <p><span className="font-semibold text-gray-600">Kỹ thuật viên:</span> {detailRequest.assigned_staff.full_name}</p>
                  <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {detailRequest.assigned_staff.phone}</p>
                  <p className="col-span-1 md:col-span-2"><span className="font-semibold text-gray-600">Lịch hẹn sửa:</span> {detailRequest.scheduled_at ? formatDate(detailRequest.scheduled_at) : "-"}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic text-xs">Yêu cầu này chưa được phân công kỹ thuật viên phụ trách.</p>
              )}
              {detailRequest.unable_reason && (
                <div className="mt-3 pt-2.5 border-t border-gray-200">
                  <span className="font-semibold text-danger-650 block text-xs">Lý do kỹ thuật / cản trở được báo cáo:</span>
                  <p className="text-danger-600 italic bg-danger-50 p-2.5 rounded-lg mt-1">{detailRequest.unable_reason}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2.5 border-t border-gray-100">
              <Button type="button" onClick={() => setShowDetailModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
