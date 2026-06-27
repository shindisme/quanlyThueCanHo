import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, FileText, Eye, Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import { toast } from "sonner";
import { DatePicker } from "../../../components/ui/DatePicker";

import { useAuthStore } from "../../../stores/auth.store";

import * as buildingService from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import * as tenantService from "../../../services/tenantService";
import * as authService from "../../../services/authService";
import * as contractService from "../../../services/contractService";

import { formatCurrency, formatDate, removeVietnameseTones, formatApartmentDisplay } from "../../../utils/format";
import type { RentalContract, Tenant, User } from "../../../types";
import type { BuildingData } from "../../../services/buildingService";
import type { ApartmentData } from "../../../services/apartmentService";

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

interface LocationState {
  openCreateModal?: boolean;
  tenantId?: string | number;
}

export default function ContractList() {
  const { role, managedBuildingId, email } = useAuthStore();
  const location = useLocation();

  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentalContract | null>(null);
  const [selectedDocContract, setSelectedDocContract] = useState<RentalContract | null>(null);
  const [selectedExtendContract, setSelectedExtendContract] = useState<RentalContract | null>(null);
  const [extendEndDate, setExtendEndDate] = useState("");
  const [initialTenantId, setInitialTenantId] = useState<number | undefined>();

  const fetchContracts = useCallback(async () => {
    try {
      const data = await contractService.getAllContracts();
      setContracts(data);
    } catch {
      setContracts([]);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load buildings
        try {
          const bRes = await buildingService.getAllBuildings({ limit: 100 });
          setBuildings(bRes.data);
        } catch {
          setBuildings([]);
        }

        // Load apartments
        try {
          const pages = [1, 2, 3, 4, 5, 6, 7];
          const resList = await Promise.all(
            pages.map((p) => apartmentService.getAllApartments({ limit: 100, page: p }))
          );
          const combined = resList.flatMap((r) => r.data);
          const unique = combined.filter((a, index, self) => self.findIndex(t => t.id === a.id) === index);
          setApartments(unique);
        } catch {
          setApartments([]);
        }

        // Load tenants
        try {
          const tRes = await tenantService.getAllTenants({ limit: 1000 });
          setTenants(tRes.data);
        } catch {
          setTenants([]);
        }

        // Load users
        try {
          const uRes = await authService.getAllUsers();
          setUsers(uRes as unknown as User[]);
        } catch {
          setUsers([]);
        }

        await fetchContracts();
      } catch {
        toast.error("Không thể tải dữ liệu hợp đồng");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [fetchContracts]);

  useEffect(() => {
    if (location.state) {
      const stateObj = location.state as LocationState;
      if (stateObj.openCreateModal) {
        setTimeout(() => {
          if (stateObj.tenantId) {
            setInitialTenantId(Number(stateObj.tenantId));
          }
          setShowCreateModal(true);
        }, 0);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location]);

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

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        title="Hợp đồng thuê"
        subtitle="Quản lý thông tin hợp đồng thuê căn hộ"
        count={filteredContracts.length}
        iconColor="linear-gradient(135deg, #EF4444, #F87171)"
        actions={
          role !== "TENANT" ? (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Tạo hợp đồng
            </Button>
          ) : undefined
        }
      />

      {/* Filter and Search */}
      <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Tìm kiếm theo mã, khách, phòng..." className="max-w-md" />

      {/* Table list */}
      {paginatedContracts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy hợp đồng nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-hidden bg-white shadow-sm">
          <Table className="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Người thuê</TableHead>
                <TableHead>Căn hộ</TableHead>
                <TableHead>Giá thuê</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chức năng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContracts.map((c) => {
                const tenant = tenants.find((t) => t.id === c.tenant_id);
                const apt = apartments.find((a) => a.id === c.apartment_id);
                const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
                const code = `HD-${String(c.id).padStart(5, "0")}`;
                const tenantName = tenant ? tenant.full_name : "-";
                const aptDisplay = apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : `-`;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-gray-800">{code}</TableCell>
                    <TableCell className="text-gray-650 font-medium">{tenantName}</TableCell>
                    <TableCell className="text-primary-600 font-semibold">{aptDisplay}</TableCell>
                    <TableCell className="text-gray-600">{formatCurrency(c.monthly_rent)}</TableCell>
                    <TableCell className="text-xs text-gray-500 font-medium">
                      {formatDate(c.start_date)} - {formatDate(c.end_date)}
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
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
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                          title="Tải/In hợp đồng"
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
        apartments={apartments}
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
          apartments={apartments}
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
          apartments={apartments}
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
              <DatePicker
                value={extendEndDate ? new Date(extendEndDate) : null}
                onChange={(date) => {
                  if (!date) {
                    setExtendEndDate("");
                    return;
                  }
                  const minDate = new Date(selectedExtendContract.end_date);
                  minDate.setHours(0, 0, 0, 0);
                  if (date < minDate) {
                    toast.error("Ngày kết thúc mới phải sau ngày kết thúc hiện tại");
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setExtendEndDate(`${y}-${m}-${d}`);
                }}
                placeholder="Chọn ngày kết thúc mới..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
