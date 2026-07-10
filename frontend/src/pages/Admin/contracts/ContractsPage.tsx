import { FileText } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Pagination from "../../../components/ui/Pagination";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Modal from "../../../components/ui/Modal";
import { Calendar } from "../../../components/ui/Calendar";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { toast } from "sonner";
import { useAuthStore } from "../../../stores/auth.store";

import { useContractList } from "../../../hooks/admin/useContractList";
import ContractList from "./components/ContractList";
import ContractDetailModal from "./components/ContractDetailModal";
import ContractDocModal from "./components/ContractDocModal";
import ContractCreateModal from "./components/ContractCreateModal";
import CheckoutModal from "./components/CheckoutModal";

export default function Contract() {
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
    createContractModal,
    selectedDetailContract,
    setSelectedDetailContract,
    selectedDocContract,
    setSelectedDocContract,
    selectedExtendContract,
    setSelectedExtendContract,
    extendEndDate,
    setExtendEndDate,
    initialTenantId,
    setInitialTenantId,
    initialApartmentId,
    setInitialApartmentId,
    initialBuildingId,
    setInitialBuildingId,
    initialFloor,
    setInitialFloor,
    filteredContracts,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedContracts,
    handleExtendContract,
    terminateItem,
    setTerminateItem,
    handleTerminateContract,
    terminating,
    fetchContracts,
    setIsNewTenantFromNavigation,
    showConfirmCancelModal,
    setShowConfirmCancelModal,
    deletingTenant,
    handleCancelCreateContract,
    handleConfirmCancelCreate,
  } = useContractList();

  const { email } = useAuthStore();
  const currentUser = users.find((u) => u.username === email) || { id: 1 };

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
      <PageHeader
        icon={FileText}
        title="Hợp đồng thuê"
        subtitle="Quản lý thông tin hợp đồng thuê căn hộ"
        count={filteredContracts.length}
        iconColor="linear-gradient(135deg, #EF4444, #F87171)"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Tìm kiếm theo mã, khách, phòng..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {(role === "ADMIN" || role === "MANAGER") && (
              <Button onClick={() => createContractModal.onOpen()}>
                Tạo hợp đồng
              </Button>
            )}
          </>
        }
      />

      {/* Table list */}
      {paginatedContracts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-lg">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy hợp đồng nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ContractList
            paginatedContracts={paginatedContracts}
            tenants={tenants}
            apartments={apartments}
            buildings={buildings}
            role={role}
            setSelectedDetailContract={setSelectedDetailContract}
            setSelectedDocContract={setSelectedDocContract}
            setSelectedExtendContract={setSelectedExtendContract}
            setExtendEndDate={setExtendEndDate}
            setTerminateItem={setTerminateItem}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
            onRenewContract={(c) => {
              const apt = apartments.find((a) => a.id === c.apartment_id);
              setInitialTenantId(c.tenant_id);
              setInitialBuildingId(apt?.building_id);
              setInitialApartmentId(c.apartment_id);
              setInitialFloor(apt?.floor);
              createContractModal.onOpen();
            }}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modal Chi Tiết Hợp Đồng */}
      <ContractDetailModal
        isOpen={selectedDetailContract !== null}
        onClose={() => setSelectedDetailContract(null)}
        contract={selectedDetailContract}
        tenants={tenants}
        apartments={apartments}
        buildings={buildings}
        users={users}
        role={role}
      />

      {/* Modal In HĐ */}
      <ContractDocModal
        isOpen={selectedDocContract !== null}
        onClose={() => setSelectedDocContract(null)}
        contract={selectedDocContract}
        tenants={tenants}
        apartments={apartments}
        buildings={buildings}
        users={users}
        role={role}
      />

      {/* Modal Gia Hạn Hợp Đồng */}
      <Modal isOpen={selectedExtendContract !== null} onClose={() => setSelectedExtendContract(null)} title="Gia hạn hợp đồng">
        {selectedExtendContract && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">Chọn ngày kết thúc mới</label>
              <Calendar
                value={extendEndDate || null}
                onChange={(date: Date | null) => {
                  if (!date) {
                    setExtendEndDate("");
                    return;
                  }
                  const currentEnd = new Date(selectedExtendContract.end_date);
                  if (date <= currentEnd) {
                    toast.error("Ngày kết thúc mới phải sau ngày kết thúc cũ!");
                    setExtendEndDate("");
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setExtendEndDate(`${y}-${m}-${d}`);
                }}
                placeholder="Chọn ngày gia hạn..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedExtendContract(null)}>Hủy bỏ</Button>
              <Button onClick={handleExtendContract}>Xác nhận gia hạn</Button>
            </div>
          </div>
        )}
      </Modal>

      <CheckoutModal
        isOpen={!!terminateItem}
        onClose={() => setTerminateItem(null)}
        contract={terminateItem}
        onConfirmCheckout={handleTerminateContract}
        isLoading={terminating}
      />

      <ContractCreateModal
        isOpen={createContractModal.isOpen}
        onClose={handleCancelCreateContract}
        onSuccess={() => {
          fetchContracts();
          setIsNewTenantFromNavigation(false);
          setInitialTenantId(undefined);
          createContractModal.onClose();
        }}
        buildings={buildings}
        apartments={apartments}
        tenants={tenants}
        currentUser={currentUser}
        role={role}
        managerBuildingId={managedBuildingId || undefined}
        initialTenantId={initialTenantId}
        initialBuildingId={initialBuildingId}
        initialApartmentId={initialApartmentId}
        initialFloor={initialFloor}
      />

      <ConfirmDialog
        isOpen={showConfirmCancelModal}
        onClose={() => setShowConfirmCancelModal(false)}
        onConfirm={handleConfirmCancelCreate}
        title="Xác nhận hủy tạo người thuê"
        message="Bạn có chắc chắn muốn hủy tạo hợp đồng? Người thuê mới vừa tạo sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu."
        variant="danger"
        confirmText="Hủy tạo & Xóa"
        cancelText="Quay lại"
        isLoading={deletingTenant}
      />
    </div>
  );
}
