import { useState, useEffect } from "react";
import { Plus, Loader2, FileText, Eye, Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import { toast } from "sonner";

import { useAuthStore } from "../../../stores/auth.store";
import { mockBuildings } from "../../../data/buildings";
import { mockApartments } from "../../../data/apartments";
import { mockTenants } from "../../../data/tenants";
import { mockUsers } from "../../../data/users";
import { mockContracts } from "../../../data/contracts";

import * as buildingService from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import * as tenantService from "../../../services/tenantService";
import * as authService from "../../../services/authService";
import * as contractService from "../../../services/contractService";

import { formatCurrency, formatDate, removeVietnameseTones, formatApartmentDisplay } from "../../../utils/format";
import type { RentalContract, Tenant, Apartment } from "../../../types";
import type { BuildingData } from "../../../services/buildingService";

import ContractCreateModal from "./components/ContractCreateModal";
import ContractDetailModal from "./components/ContractDetailModal";
import ContractDocModal from "./components/ContractDocModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

export default function ContractList() {
  const { role, managedBuildingId, email } = useAuthStore();
  const location = useLocation();

  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentalContract | null>(null);
  const [selectedDocContract, setSelectedDocContract] = useState<RentalContract | null>(null);
  const [selectedExtendContract, setSelectedExtendContract] = useState<RentalContract | null>(null);
  const [extendEndDate, setExtendEndDate] = useState("");
  const [initialTenantId, setInitialTenantId] = useState<number | undefined>();

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).openCreateModal) {
      const stateObj = location.state as any;
      if (stateObj.tenantId) {
        setInitialTenantId(Number(stateObj.tenantId));
      }
      setShowCreateModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  async function loadAllData() {
    try {
      setLoading(true);

      // Load buildings
      try {
        const bRes = await buildingService.getAllBuildings({ limit: 100 });
        setBuildings(bRes.data);
      } catch {
        setBuildings(mockBuildings as any);
      }

      // Load apartments
      try {
        const pages = [1, 2, 3, 4, 5, 6, 7];
        const resList = await Promise.all(
          pages.map((p) => apartmentService.getAllApartments({ limit: 100, page: p }))
        );
        const combined = resList.flatMap((r) => r.data);
        const unique = combined.filter((a, index, self) => self.findIndex(t => t.id === a.id) === index);
        setApartments(unique as any);
      } catch {
        setApartments(mockApartments as any);
      }

      // Load tenants
      try {
        const tRes = await tenantService.getAllTenants({ limit: 1000 });
        setTenants(tRes.data);
      } catch {
        setTenants(mockTenants);
      }

      // Load users
      try {
        const uRes = await authService.getAllUsers();
        setUsers(uRes);
      } catch {
        setUsers(mockUsers);
      }

      await fetchContracts();
    } catch {
      toast.error("Không thể tải dữ liệu hợp đồng");
    } finally {
      setLoading(false);
    }
  }

  async function fetchContracts() {
    try {
      const data = await contractService.getAllContracts();
      setContracts(data);
    } catch {
      setContracts(mockContracts as any);
    }
  }

  const displayContracts = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const buildingApartmentIds = apartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id);
      return contracts.filter((c) => buildingApartmentIds.includes(c.apartment_id));
    }
    if (role === "TENANT") {
      const currentUser = users.find((u) => u.username === email);
      const currentTenant = currentUser
        ? tenants.find((t) => t.user_id === currentUser.id)
        : null;
      if (currentTenant) {
        return contracts.filter((c) => c.tenant_id === currentTenant.id);
      }
      return [];
    }
    return contracts;
  })();

  const filteredContracts = displayContracts.filter((c) => {
    const term = removeVietnameseTones(search);
    const code = `HD-${String(c.id).padStart(5, "0")}`;
    const tenant = tenants.find((t) => t.id === c.tenant_id);
    const tenantName = tenant ? removeVietnameseTones(tenant.full_name) : "";
    const apt = apartments.find((a) => a.id === c.apartment_id);
    const room = apt ? removeVietnameseTones(apt.room_number) : "";

    return (
      code.toLowerCase().includes(term.toLowerCase()) ||
      tenantName.toLowerCase().includes(term.toLowerCase()) ||
      room.toLowerCase().includes(term.toLowerCase())
    );
  });

  // Pagination
  const paginatedContracts = (() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredContracts.slice(start, end);
  })();

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredContracts.length / pageSize)));
  }, [filteredContracts.length]);

  async function handleExtendContract() {
    if (!selectedExtendContract || !extendEndDate) {
      toast.error("Vui lòng chọn ngày kết thúc mới!");
      return;
    }

    try {
      await contractService.extendContract(selectedExtendContract.id, extendEndDate);
      toast.success("Gia hạn hợp đồng thành công!");
      setSelectedExtendContract(null);
      setExtendEndDate("");
      fetchContracts();
    } catch {
      toast.error("Gia hạn hợp đồng thất bại!");
    }
  }

  function getStatusBadge(status: string) {
    if (status === "ACTIVE") return <Badge variant="success">Còn hạn</Badge>;
    if (status === "ENDED") return <Badge variant="gray">Hết hạn</Badge>;
    return <Badge variant="danger">Đã thanh lý</Badge>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={FileText}
        title="Hợp đồng"
        subtitle="Quản lý danh sách hợp đồng cho thuê"
        count={filteredContracts.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
        actions={
          role !== "TENANT" && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Tạo hợp đồng
            </Button>
          )
        }
      />

      {/* Filter and Search */}
      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setCurrentPage(1); }}
        placeholder="Tìm theo mã hợp đồng, tên khách hoặc số phòng..."
        className="max-w-md"
      />

      {/* Table list */}
      {paginatedContracts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy hợp đồng nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm font-sans mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Người thuê</TableHead>
                <TableHead>Căn hộ</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Tiền thuê/tháng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chức năng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContracts.map((c) => {
                const tenantObj = tenants.find((t) => t.id === c.tenant_id);
                const aptObj = apartments.find((a) => a.id === c.apartment_id);
                const buildingObj = aptObj ? buildings.find((b) => b.id === aptObj.building_id) : null;
                const code = `HD-${String(c.id).padStart(5, "0")}`;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-primary-600">
                      {code}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      <span className="font-medium block">{tenantObj?.full_name || "Chưa xác định"}</span>
                      <span className="text-xs text-gray-400">{tenantObj?.phone || ""}</span>
                    </TableCell>
                    <TableCell className="text-gray-700 text-xs">
                      <span className="font-semibold text-primary-600 block">
                        {buildingObj?.branch_name || "Yuki House"}
                      </span>
                      <span>
                        {aptObj ? formatApartmentDisplay(aptObj.room_number, aptObj.floor) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-650 text-xs space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Từ:</span>
                        <span className="font-medium text-gray-800">{formatDate(c.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Đến:</span>
                        <span className="font-medium text-gray-800">{formatDate(c.end_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-800">
                      {formatCurrency(c.monthly_rent)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(c.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDetailContract(c)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setSelectedDocContract(c)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-650 hover:bg-blue-50 cursor-pointer"
                          title="Xem văn bản hợp đồng"
                        >
                          <FileText size={16} />
                        </button>
                        {c.status === "ACTIVE" && role !== "TENANT" && (
                          <button
                            onClick={() => {
                              setSelectedExtendContract(c);
                              setExtendEndDate("");
                            }}
                            className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer"
                            title="Gia hạn"
                          >
                            <Calendar size={16} />
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Contract Create Modal */}
      <ContractCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchContracts();
          toast.success("Tạo hợp đồng thành công!");
        }}
        buildings={buildings}
        apartments={apartments as any}
        tenants={tenants}
        currentUser={{ id: 1 }}
        role={role}
        managerBuildingId={managedBuildingId || undefined}
        initialTenantId={initialTenantId}
      />

      {/* Contract Detail Modal */}
      {selectedDetailContract && (
        <ContractDetailModal
          isOpen={!!selectedDetailContract}
          onClose={() => setSelectedDetailContract(null)}
          contract={selectedDetailContract}
          buildings={buildings}
          apartments={apartments as any}
          tenants={tenants}
          users={users}
          role={role}
        />
      )}

      {/* Contract Document Modal */}
      {selectedDocContract && (
        <ContractDocModal
          isOpen={!!selectedDocContract}
          onClose={() => setSelectedDocContract(null)}
          contract={selectedDocContract}
          buildings={buildings}
          apartments={apartments as any}
          tenants={tenants}
          users={users}
          role={role}
        />
      )}

      {/* Extend Contract Modal */}
      <Modal
        isOpen={!!selectedExtendContract}
        onClose={() => setSelectedExtendContract(null)}
        title="Gia hạn hợp đồng"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedExtendContract(null)}>
              Hủy
            </Button>
            <Button onClick={handleExtendContract}>Gia hạn</Button>
          </>
        }
      >
        {selectedExtendContract && (
          <div className="space-y-4 font-sans text-sm">
            <p>
              Gia hạn hợp đồng số <span className="font-semibold text-primary-600">HD-{String(selectedExtendContract.id).padStart(5, "0")}</span>
            </p>
            <div>
              <p className="text-gray-400 text-xs">Ngày kết thúc hiện tại</p>
              <p className="font-medium text-gray-800">{formatDate(selectedExtendContract.end_date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày kết thúc mới *</label>
              <input
                type="date"
                value={extendEndDate}
                onChange={(e) => setExtendEndDate(e.target.value)}
                min={selectedExtendContract.end_date.split("T")[0]}
                className="premium-input rounded-xl"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
