import { Wrench, Plus, ClipboardList, X } from "lucide-react";
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
import { useTenantMaintenance } from "../../../hooks/useTenantMaintenance";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

export default function MyMaintenance() {
  const {
    myRequests,
    search,
    setSearch,
    showCreateModal,
    setShowCreateModal,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    loading,
    handleSubmit,
    handleCancelRequest,
    activeContract,
    saving,
  } = useTenantMaintenance();

  const filteredRequests = myRequests.filter((r) => {
    const term = removeVietnameseTones(search.toLowerCase());
    const titleNorm = removeVietnameseTones(r.title.toLowerCase());
    const descNorm = removeVietnameseTones(r.description.toLowerCase());
    return titleNorm.includes(term) || descNorm.includes(term);
  });

  function getStatusBadge(status: string) {
    if (status === "PENDING") return <Badge variant="warning">Chờ xử lý</Badge>;
    if (status === "PROCESSING") return <Badge variant="info">Đang sửa chữa</Badge>;
    if (status === "DONE") return <Badge variant="success">Hoàn thành</Badge>;
    if (status === "NEEDS_RESCHEDULE") return <Badge variant="danger">Hẹn lại lịch</Badge>;
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
        title="Yêu cầu sửa chữa"
        subtitle="Gửi và quản lý các yêu cầu bảo trì, sửa chữa cơ sở vật chất phòng thuê của bạn"
        count={myRequests.length}
        iconColor="linear-gradient(135deg, #EC4899, #F472B6)"
        actions={
          <Button onClick={() => setShowCreateModal(true)} disabled={loading || !activeContract}>
            <Plus size={18} /> Gửi yêu cầu mới
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm yêu cầu..." className="max-w-md" />

      {/* Bảng danh sách yêu cầu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải danh sách...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy yêu cầu sửa chữa nào</p>
          {!activeContract && (
            <p className="text-xs text-red-500 mt-1">Lưu ý: Bạn phải có hợp đồng thuê hoạt động mới có thể tạo yêu cầu.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredRequests.map((req) => {
              const aptRoom = req.apartment ? `Phòng ${req.apartment.room_number}` : "Chưa xác định";
              return (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-600 text-base">
                      {req.title}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Ngày gửi:</span> {formatDate(req.created_at)}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Phòng:</span> {aptRoom}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Độ ưu tiên:</span> {getPriorityBadge(req.priority)}
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      <span className="font-semibold text-gray-700 not-italic">Mô tả:</span> {req.description}
                    </p>
                    {req.unable_reason && (
                      <p className="text-xs text-red-500">
                        <span className="font-semibold text-red-700">Lý do kỹ thuật:</span> {req.unable_reason}
                      </p>
                    )}
                  </div>

                  {req.status === "PENDING" && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <X size={14} /> Hủy yêu cầu
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* View List*/}
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-sm rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Mô tả chi tiết</TableHead>
                  <TableHead className="text-center">Độ ưu tiên</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => {
                  const aptRoom = req.apartment ? `Phòng ${req.apartment.room_number}` : "Chưa xác định";
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</TableCell>
                      <TableCell className="font-medium text-gray-800 whitespace-nowrap">{aptRoom}</TableCell>
                      <TableCell className="font-semibold text-primary-600">{req.title}</TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate" title={req.description}>
                        {req.description}
                      </TableCell>
                      <TableCell className="text-center">{getPriorityBadge(req.priority)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        {req.status === "PENDING" && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={saving}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                            title="Hủy yêu cầu"
                          >
                            <X size={14} /> Hủy
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal gửi yêu cầu mới */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Gửi Yêu Cầu Sửa Chữa Mới">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tiêu đề yêu cầu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mức độ khẩn cấp</label>
            <Combobox
              options={[
                { value: "LOW", label: "Thấp (Có thể xử lý sau vài ngày)" },
                { value: "MEDIUM", label: "Trung bình (Xử lý trong vòng 24-48h)" },
                { value: "HIGH", label: "Khẩn cấp (Cần xử lý ngay trong ngày)" }
              ]}
              value={priority}
              onChange={(val) => setPriority(val as "LOW" | "MEDIUM" | "HIGH")}
              searchable={false}
              className="w-full"
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mô tả chi tiết sự cố</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving}>Gửi yêu cầu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
