import { Plus, FileText, Eye, Calendar as CalendarIcon } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Modal from "../../../components/ui/Modal";
import { Calendar } from "../../../components/ui/Calendar";
import { toast } from "sonner";

import { useContractList } from "../../../hooks/useContractList";
import { formatCurrency } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import { formatApartmentDisplay } from "../../../utils/string";

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
  const {
    role,
    managedBuildingId,
    buildings,
    apartments,
    tenants,
    users,
    loading,
    search,
    setSearch,
    createModal,
    selectedDetailContract,
    setSelectedDetailContract,
    selectedDocContract,
    setSelectedDocContract,
    selectedExtendContract,
    setSelectedExtendContract,
    extendEndDate,
    setExtendEndDate,
    initialTenantId,
    filteredContracts,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedContracts,
    handleExtendContract,
    fetchContracts,
  } = useContractList();

  function getStatusBadge(status: string) {
    if (status === "ACTIVE") return <Badge variant="success">Còn hạn</Badge>;
    if (status === "ENDED") return <Badge variant="gray">Hết hạn</Badge>;
    return <Badge variant="danger">Đã thanh lý</Badge>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách hợp đồng...</span>
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
            <Button onClick={createModal.onOpen}>
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
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedContracts.map((c) => {
              const tenant = tenants.find((t) => t.id === c.tenant_id);
              const apt = apartments.find((a) => a.id === c.apartment_id);
              const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
              const code = `HD-${String(c.id).padStart(5, "0")}`;
              const tenantName = tenant ? tenant.full_name : "-";
              const aptDisplay = apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : `-`;

              return (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-base">
                      {code}
                    </span>
                    {getStatusBadge(c.status)}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Người thuê:</span> {tenantName}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Căn hộ:</span> <span className="text-primary-600 font-semibold">{aptDisplay}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Giá thuê:</span> <span className="font-bold text-gray-805">{formatCurrency(c.monthly_rent)} / tháng</span>
                    </p>
                    <p className="text-xs">
                      <span className="font-semibold text-gray-700">Thời hạn:</span> {formatDate(c.start_date)} - {formatDate(c.end_date)}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedDetailContract(c)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                    <button
                      onClick={() => setSelectedDocContract(c)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <FileText size={14} /> Tải/In HĐ
                    </button>
                    {c.status === "ACTIVE" && role !== "TENANT" && (
                      <button
                        onClick={() => {
                          setSelectedExtendContract(c);
                          setExtendEndDate("");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <CalendarIcon size={14} /> Gia hạn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* View List */}
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-sm">
            <Table className="compact">
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("id")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Mã HĐ {getSortIcon("id")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("tenant")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Người thuê {getSortIcon("tenant")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("apartment")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Căn hộ {getSortIcon("apartment")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("monthly_rent")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Giá thuê {getSortIcon("monthly_rent")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("end_date")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Thời hạn {getSortIcon("end_date")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Trạng thái {getSortIcon("status")}
                  </TableHead>
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
                      <TableCell className="text-gray-655 font-medium">{tenantName}</TableCell>
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
                              <CalendarIcon size={16} />
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
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
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
              <Calendar
                value={extendEndDate ? new Date(extendEndDate) : null}
                onChange={(date: Date | null) => {
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
