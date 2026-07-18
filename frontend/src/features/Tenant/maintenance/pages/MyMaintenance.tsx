import { Wrench, Plus, X } from "lucide-react";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import SearchInput from "../../../../components/ui/SearchInput";
import PageHeader from "../../../../components/PageHeader";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { formatDate } from "../../../../utils/date";
import { removeVietnameseTones } from "../../../../utils/string";
import { useTenantMaintenance } from "../hooks/useTenantMaintenance";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, type RequestStatus, type Priority } from "../../../../constants/enums";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { MaintenanceRequest } from "../../../../types";

export default function MyMaintenance() {
  const {
    myRequests,
    search,
    setSearch,
    createModal,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    loading,
    handleCreateMaintenanceRequest,
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

  function getStatusBadge(status: RequestStatus) {
    const label = REQUEST_STATUS_LABELS[status] || status;
    const variant = REQUEST_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant as BadgeVariant}>{label}</Badge>;
  }

  function getPriorityBadge(priority: Priority) {
    const label = PRIORITY_LABELS[priority] || priority;
    const variant = PRIORITY_COLORS[priority] || "gray";
    return <Badge variant={variant as BadgeVariant}>{label}</Badge>;
  }

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "created_at",
      label: "Ngày gửi",
      render: (req: MaintenanceRequest) => <span className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</span>,
    },
    {
      key: "room",
      label: "Phòng",
      render: (req: MaintenanceRequest) => {
        const aptRoom = req.apartment ? `Phòng ${req.apartment.room_number}` : "Chưa xác định";
        return <span className="font-medium text-gray-805 whitespace-nowrap">{aptRoom}</span>;
      }
    },
    {
      key: "title",
      label: "Tiêu đề",
      isTitle: true,
      render: (req: MaintenanceRequest) => <span className="font-semibold text-primary-600">{req.title}</span>,
    },
    {
      key: "description",
      label: "Mô tả chi tiết",
      render: (req: MaintenanceRequest) => (
        <span className="text-gray-600 max-w-xs truncate block" title={req.description}>
          {req.description}
        </span>
      )
    },
    {
      key: "priority",
      label: "Độ ưu tiên",
      className: "text-center",
      render: (req: MaintenanceRequest) => getPriorityBadge(req.priority as Priority),
    },
    {
      key: "status",
      label: "Trạng thái",
      className: "text-center",
      render: (req: MaintenanceRequest) => getStatusBadge(req.status as RequestStatus),
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      isAction: true,
      render: (req: MaintenanceRequest) => (
        req.status === "PENDING" ? (
          <button
            type="button"
            onClick={() => handleCancelRequest(req.id)}
            disabled={saving}
            className="p-2 rounded-lg text-gray-500 hover:text-red-605 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            title="Hủy yêu cầu"
          >
            <X size={14} /> Hủy
          </button>
        ) : null
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách yêu cầu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Wrench}
        title="Yêu cầu sửa chữa"
        subtitle="Gửi và quản lý các yêu cầu bảo trì, sửa chữa cơ sở vật chất phòng thuê của bạn"
        count={myRequests.length}
        iconColor="linear-gradient(135deg, #EC4899, #F472B6)"
        actions={
          <Button onClick={createModal.onOpen} disabled={loading || !activeContract}>
            <Plus size={18} /> Gửi yêu cầu mới
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm yêu cầu..." className="max-w-md" />

      {!activeContract && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-sans font-semibold">
          Lưu ý: Bạn phải có hợp đồng thuê hoạt động mới có thể tạo yêu cầu bảo trì, sửa chữa.
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredRequests}
        emptyMessage="Không tìm thấy yêu cầu sửa chữa nào"
      />

      {/* Modal gửi yêu cầu mới */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} title="Gửi Yêu Cầu Sửa Chữa Mới">
        <form onSubmit={handleCreateMaintenanceRequest} className="space-y-4 font-sans text-left">
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
            <Button variant="outline" type="button" onClick={createModal.onClose} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving}>Gửi yêu cầu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
