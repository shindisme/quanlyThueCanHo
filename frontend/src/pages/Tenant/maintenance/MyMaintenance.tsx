import { useState } from "react";
import { Wrench, Plus } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { toast } from "sonner";

import PageHeader from "../../../components/ui/PageHeader";

// ============================================================
// YÊU CẦU SỬA CHỮA CỦA TÔI - Tenant tạo/xem yêu cầu
// ============================================================

const mockRequests = [
  {
    id: 1, title: "Bóng đèn phòng khách hỏng", description: "Bóng đèn LED phòng khách không sáng",
    priority: "MEDIUM", status: "PROCESSING", created_at: "2026-06-10",
  },
  {
    id: 2, title: "Vòi nước bồn rửa bị rỉ", description: "Vòi nước bồn rửa bếp bị rỉ nước",
    priority: "HIGH", status: "PENDING", created_at: "2026-06-08",
  },
  {
    id: 3, title: "Điều hòa không mát", description: "Điều hòa phòng ngủ kêu to và không mát",
    priority: "HIGH", status: "DONE", created_at: "2026-05-20",
  },
];

export default function MyMaintenance() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      PENDING: { label: "Mới tạo", variant: "warning" },
      PROCESSING: { label: "Đang xử lý", variant: "info" },
      DONE: { label: "Hoàn thành", variant: "success" },
      CANCELLED: { label: "Đã hủy", variant: "gray" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, { label: string; variant: string }> = {
      LOW: { label: "Thấp", variant: "gray" },
      MEDIUM: { label: "Trung bình", variant: "warning" },
      HIGH: { label: "Cao", variant: "danger" },
    };
    const p = map[priority] || { label: priority, variant: "gray" };
    return <Badge variant={p.variant as any}>{p.label}</Badge>;
  }

  function handleSubmit() {
    if (!title) { toast.error("Vui lòng nhập tiêu đề"); return; }
    toast.success("Đã gửi yêu cầu sửa chữa");
    setShowForm(false);
    setTitle(""); setDescription(""); setPriority("MEDIUM");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Yêu cầu sửa chữa"
        subtitle="Gửi và theo dõi yêu cầu bảo trì căn hộ của bạn"
        count={mockRequests.length}
        iconColor="linear-gradient(135deg, #F59E0B, #EF4444)"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Tạo yêu cầu
          </Button>
        }
      />

      {/* Danh sách yêu cầu */}
      <div className="space-y-4">
        {mockRequests.map((req) => (
          <div key={req.id} className="premium-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Wrench size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{req.title}</h3>
                  <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(req.priority)}
                {getStatusBadge(req.status)}
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-13">{req.description}</p>
          </div>
        ))}
      </div>

      {/* Modal tạo yêu cầu */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tạo yêu cầu sửa chữa"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>Gửi yêu cầu</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bóng đèn phòng khách hỏng"
                className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Mô tả vấn đề cụ thể..."
                className="premium-input rounded-xl resize-none" />
            </div>
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức độ ưu tiên</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="premium-select w-full rounded-xl">
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
