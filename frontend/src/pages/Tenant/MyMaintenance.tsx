import { useState } from "react";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import Button from "../../components/common/ui/Button";
import Modal from "../../components/common/ui/Modal";
import { useAuthStore } from "../../stores/auth.store";
import { mockMaintenanceRequests } from "../../data/maintenance";
import { mockApartments } from "../../data/apartments";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "../../constants/enums";
import { formatRelativeTime } from "../../utils/format";
import type { RequestStatus, Priority } from "../../constants/enums";
import { Plus, Wrench, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Trang yeu cau sua chua cua nguoi thue
// Hien thi danh sach yeu cau va form tao yeu cau moi
export default function TenantMaintenance() {
  const { user } = useAuthStore();
  const tenantId = user?.id ? user.id - 3 : 1;
  const [showForm, setShowForm] = useState(false);

  // Lay yeu cau cua nguoi thue
  const requests = mockMaintenanceRequests.filter((r) => r.tenant_id === tenantId);

  function getApartmentCode(aptId: number) {
    return mockApartments.find((a) => a.id === aptId)?.apartment_code || "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Yeu cau sua chua</h1>
          <p className="text-sm text-gray-500">Gui va theo doi yeu cau bao tri</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} /> Tao yeu cau moi
        </Button>
      </div>

      {/* Danh sach yeu cau */}
      <div className="space-y-3">
        {requests.map((req) => (
          <Card key={req.id}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                req.status === "DONE" ? "bg-success-50" :
                req.status === "PROCESSING" ? "bg-info-50" : "bg-warning-50"
              }`}>
                <Wrench size={22} className={
                  req.status === "DONE" ? "text-success-600" :
                  req.status === "PROCESSING" ? "text-info-600" : "text-warning-600"
                } />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{req.title}</h4>
                    <p className="text-xs text-gray-400">
                      {getApartmentCode(req.apartment_id)} - {formatRelativeTime(req.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={PRIORITY_COLORS[req.priority as Priority] as "gray" | "warning" | "danger"}>
                      {PRIORITY_LABELS[req.priority as Priority]}
                    </Badge>
                    <Badge variant={REQUEST_STATUS_COLORS[req.status as RequestStatus] as "warning" | "info" | "success" | "gray"}>
                      {REQUEST_STATUS_LABELS[req.status as RequestStatus]}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600">{req.description}</p>

                {/* Timeline cap nhat */}
                {req.status === "PROCESSING" && (
                  <div className="mt-3 p-3 bg-info-50 rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} className="text-info-600" />
                    <p className="text-xs text-info-600">
                      Yeu cau dang duoc xu ly. Cap nhat cuoi: {formatRelativeTime(req.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {requests.length === 0 && (
          <Card>
            <p className="text-center text-gray-400 py-8">Ban chua co yeu cau nao</p>
          </Card>
        )}
      </div>

      {/* Modal tao yeu cau moi */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tao yeu cau sua chua"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Huy</Button>
            <Button onClick={() => { toast.success("Da gui yeu cau sua chua"); setShowForm(false); }}>
              Gui yeu cau
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tieu de *</label>
            <input
              type="text"
              placeholder="Vi du: May lanh khong mat"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Muc do uu tien *</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500">
              <option value="LOW">Thap - Khong gap</option>
              <option value="MEDIUM">Trung binh - Can xu ly som</option>
              <option value="HIGH">Cao - Can xu ly ngay</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mo ta chi tiet *</label>
            <textarea
              rows={4}
              placeholder="Mo ta chi tiet van de ban gap phai..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hinh anh (neu co)</label>
            <input type="file" accept="image/*" multiple className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
