import { useState, useEffect } from "react";
import { Wrench, Plus, ClipboardList, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/PageHeader";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useAuthStore } from "../../../stores/auth.store";
import * as tenantService from "../../../services/tenantService";
import * as contractService from "../../../services/contractService";
import { toast } from "sonner";
import { formatDate } from "../../../utils/date";
import { removeVietnameseTones } from "../../../utils/string";
import { useDebounce } from "../../../hooks/common/useDebounce";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

interface MaintenanceRequest {
  id: number;
  tenant_id: number;
  apartment_id: number | null;
  apartment_number: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function MyMaintenance() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  const { data: tenantsData, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 1000 }),
  });
  const tenants = tenantsData?.data || [];

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
  });
  const contracts = contractsData || [];

  useEffect(() => {
    // Load requests from localStorage
    const stored = localStorage.getItem("tenant-maintenance-requests");
    if (stored) {
      setRequests(JSON.parse(stored));
    } else {
      // Initialize with some default items if empty
      const defaults: MaintenanceRequest[] = [
        {
          id: 101,
          tenant_id: 1,
          apartment_id: 1,
          apartment_number: "P.302 (Tầng 3)",
          title: "Hỏng vòi nước nhà vệ sinh",
          description: "Vòi nước bồn rửa mặt bị rỉ nước liên tục gây lãng phí nước sạch.",
          priority: "MEDIUM",
          status: "COMPLETED",
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 102,
          tenant_id: 1,
          apartment_id: 1,
          apartment_number: "P.302 (Tầng 3)",
          title: "Điều hòa không mát",
          description: "Điều hòa bật 16 độ nhưng chỉ có gió thổi ra, không lạnh. Nhờ thợ kiểm tra gas.",
          priority: "HIGH",
          status: "PENDING",
          created_at: new Date().toISOString(),
        }
      ];
      setRequests(defaults);
      localStorage.setItem("tenant-maintenance-requests", JSON.stringify(defaults));
    }
  }, []);

  const loading = loadingTenants || loadingContracts;

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded?.userId;
  const currentTenant = userId ? tenants.find((t) => t.user_id === userId) : null;
  const activeContract = currentTenant ? contracts.find((c) => c.tenant_id === currentTenant.id && c.status === "ACTIVE") : null;

  // Filter requests for current tenant
  const myRequests = currentTenant
    ? requests.filter((r) => r.tenant_id === currentTenant.id)
    : [];

  const filteredRequests = myRequests.filter((r) => {
    const term = removeVietnameseTones(debouncedSearch.toLowerCase());
    const titleNorm = removeVietnameseTones(r.title.toLowerCase());
    const descNorm = removeVietnameseTones(r.description.toLowerCase());
    return titleNorm.includes(term) || descNorm.includes(term);
  });

  function getStatusBadge(status: string) {
    if (status === "PENDING") return <Badge variant="warning">Chờ xử lý</Badge>;
    if (status === "PROCESSING") return <Badge variant="info">Đang sửa chữa</Badge>;
    if (status === "COMPLETED") return <Badge variant="success">Hoàn thành</Badge>;
    return <Badge variant="gray">Đã hủy</Badge>;
  }

  function getPriorityBadge(priority: string) {
    if (priority === "HIGH") return <Badge variant="danger">Khẩn cấp</Badge>;
    if (priority === "MEDIUM") return <Badge variant="warning">Trung bình</Badge>;
    return <Badge variant="gray">Thấp</Badge>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và mô tả chi tiết");
      return;
    }

    if (!currentTenant) {
      toast.error("Không xác định được tài khoản người thuê");
      return;
    }

    const newRequest: MaintenanceRequest = {
      id: Date.now(),
      tenant_id: currentTenant.id,
      apartment_id: activeContract?.apartment_id || null,
      apartment_number: activeContract?.apartment
        ? `Phòng ${activeContract.apartment.room_number} (Tầng ${activeContract.apartment.floor})`
        : "Chưa xác định",
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "PENDING",
      created_at: new Date().toISOString(),
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    localStorage.setItem("tenant-maintenance-requests", JSON.stringify(updated));

    // Reset form
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setShowCreateModal(false);
    toast.success("Gửi yêu cầu sửa chữa thành công!");
  };

  const handleCancelRequest = (id: number) => {
    const updated = requests.map((r) => {
      if (r.id === id) {
        return { ...r, status: "CANCELLED" as const };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem("tenant-maintenance-requests", JSON.stringify(updated));
    toast.success("Đã hủy yêu cầu sửa chữa");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Yêu cầu sửa chữa"
        subtitle="Gửi và quản lý các yêu cầu bảo trì, sửa chữa cơ sở vật chất phòng thuê của bạn"
        count={myRequests.length}
        iconColor="linear-gradient(135deg, #EC4899, #F472B6)"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
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
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredRequests.map((req) => (
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
                    <span className="font-semibold text-gray-700">Phòng:</span> {req.apartment_number}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Độ ưu tiên:</span> {getPriorityBadge(req.priority)}
                  </p>
                  <p className="text-xs text-gray-405 italic">
                    <span className="font-semibold text-gray-700 not-italic">Mô tả:</span> {req.description}
                  </p>
                </div>

                {req.status === "PENDING" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <X size={14} /> Hủy yêu cầu
                    </button>
                  </div>
                )}
              </div>
            ))}
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
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</TableCell>
                    <TableCell className="font-medium text-gray-800 whitespace-nowrap">{req.apartment_number}</TableCell>
                    <TableCell className="font-semibold text-primary-600">{req.title}</TableCell>
                    <TableCell className="text-gray-655 max-w-xs truncate" title={req.description}>
                      {req.description}
                    </TableCell>
                    <TableCell className="text-center">{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      {req.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="p-2 rounded-lg text-gray-450 hover:text-red-600 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
                          title="Hủy yêu cầu"
                        >
                          <X size={14} /> Hủy
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
            placeholder="Ví dụ: Hỏng bóng đèn bếp, nghẹt bồn cầu..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mô tả chi tiết sự cố</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
              placeholder="Vui lòng tả rõ vị trí hỏng, hiện trạng sự cố để kỹ thuật viên chuẩn bị dụng cụ phù hợp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit">Gửi yêu cầu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
