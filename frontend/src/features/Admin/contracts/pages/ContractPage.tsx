import { FileText } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import SearchInput from "../../../../components/ui/SearchInput";
import Pagination from "../../../../components/ui/Pagination";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Combobox from "../../../../components/ui/Combobox";
import Modal from "../../../../components/ui/Modal";
import { DatePicker } from "../../../../components/ui/DatePicker";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import EmptyState from "../../../../components/ui/EmptyState";
import { useAuthStore } from "../../../../stores/auth.store";

import { useContractPage } from "../hooks/useContractPage";
import ContractList from "../components/ContractList";
import ContractDetailModal from "../components/ContractDetailModal";
import ContractDocModal from "../../../../components/ContractDocModal";
import ContractCreateModal from "../components/ContractCreateModal";
import CheckoutModal from "../components/CheckoutModal";
import { toast } from "sonner";
import { formatDate } from "../../../../utils/date";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import {
    CONTRACT_TERMINATION_TYPE_CONFIG,
    CONTRACT_TERMINATION_STATUS_CONFIG,
    CONTRACT_STATUS_LABELS,
    DEPOSIT_POLICY_CONFIG,
    isOpenContractTerminationStatus,
} from "../../../../constants";

function formatMoney(value: number | string | null | undefined) {
    return formatCurrency(Number(value || 0));
}
export default function Contract() {
    const {
        role,
        managedBuildingId,
        contracts,
        buildings,
        apartments,
        tenants,
        users,
        loading,
        search,
        setSearch,
        filterBuilding,
        setFilterBuilding,
        filterStatus,
        setFilterStatus,
        filterMonth,
        setFilterMonth,
        filterYear,
        setFilterYear,
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
        initialBuildingId,
        initialFloor,
        filteredContracts,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedContracts,
        startIdx,
        requestSort,
        sortConfig,
        handleExtendContract,
        terminateItem,
        setTerminateItem,
        terminationItem,
        selectedTerminationDetail,
        setSelectedTerminationDetail,
        openTerminationsByContractId,
        overdueCandidateIds,
        handleApproveTermination,
        handleRejectTermination,
        handleCancelTermination,
        handleCreateOverdueTermination,
        handleOpenTerminationCheckout,
        handleCloseTerminationCheckout,
        cancelContractItem,
        setCancelContractItem,
        cancelContractReason,
        setCancelContractReason,
        handleConfirmCancelContract,
        terminating,
        fetchContracts,
        setIsNewTenantFromNavigation,
        showConfirmCancelModal,
        setShowConfirmCancelModal,
        deletingTenant,
        handleCancelCreateContract,
        handleConfirmCancelCreate,
    } = useContractPage();

    const { email } = useAuthStore();
    const currentUser = users.find((u) => u.username === email) || { id: 1 };
    const terminationDetail = selectedTerminationDetail;
    const terminationTypeConfig = terminationDetail ? CONTRACT_TERMINATION_TYPE_CONFIG[terminationDetail.type] : null;
    const terminationStatusConfig = terminationDetail ? CONTRACT_TERMINATION_STATUS_CONFIG[terminationDetail.status] : null;
    const depositPolicyConfig = terminationDetail ? DEPOSIT_POLICY_CONFIG[terminationDetail.deposit_policy] : null;
    const terminationDetailContract = terminationDetail?.contract || (terminationDetail ? contracts.find((c) => c.id === terminationDetail.contract_id) : null);
    const terminationDetailApartment = terminationDetailContract?.apartment || (terminationDetailContract ? apartments.find((a) => a.id === terminationDetailContract.apartment_id) : null);
    const terminationDetailBuilding = terminationDetailApartment?.building || (terminationDetailApartment ? buildings.find((b) => b.id === terminationDetailApartment.building_id) : null);
    const terminationDetailTenant = terminationDetailContract?.tenant || (terminationDetailContract ? tenants.find((t) => t.id === terminationDetailContract.tenant_id) : null);
    const terminationRequester = terminationDetail?.requested_by ? users.find((u) => u.id === terminationDetail.requested_by) : null;
    const terminationApprover = terminationDetail?.approved_by ? users.find((u) => u.id === terminationDetail.approved_by) : null;
    const terminationFinalInvoice = terminationDetail?.final_invoice ?? null;
    const terminationFinalItems = terminationFinalInvoice?.items ?? [];
    const terminationDamages = terminationFinalItems
        .filter((item) => item.item_name.startsWith("Bồi thường:") || item.item_name === "Cơ sở vật chất hư hại")
        .map((item) => ({
            id: item.id,
            description: item.item_name.replace(/^Bồi thường:\s*/, ""),
            amount: Math.abs(Number(item.amount || 0)),
            note: null as string | null,
        }));
    const canCancelTerminationDetail = !!terminationDetail
        && (role === "ADMIN" || role === "MANAGER")
        && isOpenContractTerminationStatus(terminationDetail.status);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100">
                <LoadingSpinner size={36} />
                <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách hợp đồng...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Hợp đồng thuê"
                subtitle="Quản lý thông tin hợp đồng thuê căn hộ"
                count={filteredContracts.length}
                actions={
                    <>
                        <SearchInput
                            value={search}
                            onChange={(v) => { setSearch(v); setCurrentPage(1); }}
                            placeholder="Tìm kiếm theo mã, khách, phòng..."
                            className="w-full min-w-0 flex-1 sm:w-80"
                        />
                        {(role === "ADMIN" || role === "MANAGER") && (
                            <Button onClick={() => createContractModal.onOpen()}>
                                Tạo hợp đồng
                            </Button>
                        )}
                    </>
                }
            />

            {/* Search vs Filter */}
            <div className="grid grid-cols-12 gap-3 w-full">
                {role !== "MANAGER" && (
                    <div className="col-span-12 sm:col-span-6 md:col-span-3">
                        <Combobox
                            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
                            value={filterBuilding ? String(filterBuilding) : ""}
                            onChange={(val) => {
                                setFilterBuilding(val ? Number(val) : undefined);
                                setCurrentPage(1);
                            }}
                            placeholder="Tất cả chi nhánh"
                            className="w-full"
                            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
                            clearable={true}
                        />
                    </div>
                )}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                    <Combobox
                        options={[
                            { value: "TERMINATION_OPEN", label: "Đang trả phòng" },
                            { value: "ACTIVE", label: CONTRACT_STATUS_LABELS.ACTIVE },
                            { value: "ENDED", label: CONTRACT_STATUS_LABELS.ENDED }
                        ]}
                        value={filterStatus || ""}
                        onChange={(val) => {
                            setFilterStatus(val || undefined);
                            setCurrentPage(1);
                        }}
                        placeholder="Tất cả trạng thái"
                        searchable={false}
                        className="w-full"
                        triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
                        clearable={true}
                    />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                    <Combobox
                        options={Array.from({ length: 12 }, (_, i) => ({
                            value: String(i + 1),
                            label: `Tháng ${i + 1}`,
                        }))}
                        value={filterMonth ? String(filterMonth) : ""}
                        onChange={(val) => {
                            setFilterMonth(val ? Number(val) : undefined);
                            setCurrentPage(1);
                        }}
                        placeholder="Tất cả tháng"
                        searchable={false}
                        className="w-full"
                        triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
                        clearable={true}
                    />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                    <Combobox
                        options={
                            (contracts.length > 0
                                ? Array.from(new Set(contracts.map((c) => new Date(c.start_date).getFullYear()))).sort((a, b) => b - a)
                                : [new Date().getFullYear()]
                            ).map((y) => ({ value: String(y), label: `Năm ${y}` }))
                        }
                        value={filterYear ? String(filterYear) : ""}
                        onChange={(val) => {
                            setFilterYear(val ? Number(val) : undefined);
                            setCurrentPage(1);
                        }}
                        placeholder="Tất cả năm"
                        searchable={false}
                        className="w-full"
                        triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
                        clearable={true}
                    />
                </div>
            </div>

            {/* Table list */}
            {paginatedContracts.length === 0 ? (
                <EmptyState
                    icon={<FileText size={48} />}
                    title="Không tìm thấy hợp đồng nào"
                    description="Thử tìm kiếm với từ khóa khác"
                />
            ) : (
                <div className="space-y-4">
                    <ContractList
                        paginatedContracts={paginatedContracts}
                        startIdx={startIdx}
                        totalItems={filteredContracts.length}
                        sortConfig={sortConfig}
                        onSort={(key) => { requestSort(key); setCurrentPage(1); }}
                        tenants={tenants}
                        apartments={apartments}
                        buildings={buildings}
                        role={role}
                        setSelectedDetailContract={setSelectedDetailContract}
                        setSelectedDocContract={setSelectedDocContract}
                        setSelectedExtendContract={setSelectedExtendContract}
                        setExtendEndDate={setExtendEndDate}
                        setTerminateItem={setTerminateItem}
                        setCancelContractItem={setCancelContractItem}
                        openTerminationsByContractId={openTerminationsByContractId}
                        overdueCandidateIds={overdueCandidateIds}
                        onApproveTermination={handleApproveTermination}
                        onRejectTermination={handleRejectTermination}
                        onCreateOverdueTermination={handleCreateOverdueTermination}
                        onOpenTerminationCheckout={handleOpenTerminationCheckout}
                        onViewTermination={setSelectedTerminationDetail}
                        isTerminationActionPending={terminating}
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
                            <DatePicker
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
                onClose={handleCloseTerminationCheckout}
                contract={terminateItem}
                termination={terminationItem}
                isLoading={terminating}
            />

            <Modal
                isOpen={selectedTerminationDetail !== null}
                onClose={() => setSelectedTerminationDetail(null)}
                title="Chi tiết yêu cầu thanh lý"
                size="xl"
                footer={
                    <>
                        {canCancelTerminationDetail && terminationDetail && (
                            <Button
                                variant="danger"
                                onClick={() => handleCancelTermination(terminationDetail)}
                                isLoading={terminating}
                            >
                                Hủy thanh lý
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setSelectedTerminationDetail(null)}>Đóng</Button>
                    </>
                }
            >
                {terminationDetail && (
                    <div className="space-y-5 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={terminationTypeConfig?.badge}>{terminationTypeConfig?.label}</Badge>
                            <Badge variant={terminationStatusConfig?.badge}>
                                {terminationStatusConfig?.label}
                            </Badge>
                            <Badge variant={depositPolicyConfig?.badge}>
                                {depositPolicyConfig?.label}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Mã hợp đồng</p>
                                <p className="font-semibold text-gray-900">HD-{String(terminationDetail.contract_id).padStart(5, "0")}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Khách thuê</p>
                                <p className="font-semibold text-gray-900">{terminationDetailTenant?.full_name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Căn hộ</p>
                                <p className="font-semibold text-gray-900">
                                    {terminationDetailApartment ? formatApartmentDisplay(terminationDetailApartment.room_number, terminationDetailApartment.floor) : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Chi nhánh</p>
                                <p className="font-semibold text-gray-900">{terminationDetailBuilding?.branch_name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Ngày gửi yêu cầu</p>
                                <p className="font-semibold text-gray-900">{formatDate(terminationDetail.requested_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Ngày đề xuất trả phòng</p>
                                <p className="font-semibold text-gray-900">{formatDate(terminationDetail.requested_end_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Ngày chấm dứt hiệu lực</p>
                                <p className="font-semibold text-gray-900">{terminationDetail.effective_end_date ? formatDate(terminationDetail.effective_end_date) : "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Số ngày báo trước</p>
                                <p className="font-semibold text-gray-900">{terminationDetail.notice_days} ngày</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Tỷ lệ hoàn cọc</p>
                                <p className="font-semibold text-gray-900">{Number(terminationDetail.refund_rate || 0)}%</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">Người gửi / duyệt</p>
                                <p className="font-semibold text-gray-900">
                                    {terminationRequester?.username || terminationRequester?.email || "Khách thuê"}
                                    {terminationApprover ? ` / ${terminationApprover.username || terminationApprover.email}` : ""}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase text-gray-400">Lý do</p>
                            <p className="mt-1 min-h-16 rounded-lg border border-gray-200 bg-gray-50 p-3 whitespace-pre-wrap text-gray-800">
                                {terminationDetail.reason || "-"}
                            </p>
                        </div>

                        {(terminationDetail.rejected_reason || terminationDetail.inspection_note || terminationDetail.requires_maintenance) && (
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="font-bold text-gray-900">Ghi chú xử lý</h4>
                                {terminationDetail.rejected_reason && <p><span className="font-semibold">Lý do từ chối:</span> {terminationDetail.rejected_reason}</p>}
                                {terminationDetail.inspection_note && <p><span className="font-semibold">Ghi chú kiểm tra:</span> {terminationDetail.inspection_note}</p>}
                                <p><span className="font-semibold">Cần bảo trì:</span> {terminationDetail.requires_maintenance ? "Có" : "Không"}</p>
                            </div>
                        )}

                        {terminationDamages.length > 0 && (
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="font-bold text-gray-900">Hư hỏng ghi nhận</h4>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    {terminationDamages.map((damage, index) => (
                                        <div key={damage.id || index} className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-100 p-3 last:border-b-0">
                                            <div>
                                                <p className="font-semibold text-gray-900">{damage.description}</p>
                                                {damage.note && <p className="text-xs text-gray-500">{damage.note}</p>}
                                            </div>
                                            <p className="font-bold text-red-600">{formatMoney(damage.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {terminationFinalInvoice && (
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="font-bold text-gray-900">Hóa đơn quyết toán</h4>
                                    <Badge variant={terminationFinalInvoice.status === "PAID" ? "success" : "warning"}>
                                        {terminationFinalInvoice.status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                                    </Badge>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    {terminationFinalItems.map((item) => {
                                        const amount = Number(item.amount || 0);
                                        return (
                                            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-100 p-3 last:border-b-0">
                                                <p className="font-semibold text-gray-900">{item.item_name}</p>
                                                <p className={`font-bold ${amount < 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                    {formatMoney(amount)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    <div className="grid grid-cols-[1fr_auto] gap-3 bg-gray-50 p-3">
                                        <p className="font-bold text-gray-900">Khách cần thanh toán</p>
                                        <p className="font-extrabold text-red-600">{formatMoney(terminationFinalInvoice.total_amount)}</p>
                                    </div>
                                </div>
                                <p className="rounded-lg bg-gray-50 p-3">
                                    <span className="font-semibold">Mã hóa đơn:</span> {terminationFinalInvoice.invoice_code}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
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
                message="Bạn có chắc chắn muốn hủy tạo hợp đồng?."
                variant="danger"
                confirmText="Hủy tạo & Xóa"
                cancelText="Quay lại"
                isLoading={deletingTenant}
            />

            <Modal
                isOpen={cancelContractItem !== null}
                onClose={() => {
                    if (terminating) return;
                    setCancelContractItem(null);
                    setCancelContractReason("");
                }}
                title={`Hủy hợp đồng: HD-${String(cancelContractItem?.id || 0).padStart(5, "0")}`}
                size="md"
            >
                <div className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Sau khi xác nhận, hệ thống sẽ mở ngay quy trình thanh lý gồm chốt điện nước, quyết toán, đối trừ cọc và hoàn tất bàn giao.
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Lý do hủy hợp đồng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={cancelContractReason}
                            onChange={(event) => setCancelContractReason(event.target.value)}
                            maxLength={5000}
                            rows={4}
                            autoFocus
                            disabled={terminating}
                            placeholder="Nhập lý do hủy hợp đồng..."
                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
                        />
                        <p className="text-right text-xs text-gray-400">{cancelContractReason.length}/5000</p>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                        <Button
                            variant="outline"
                            disabled={terminating}
                            onClick={() => {
                                setCancelContractItem(null);
                                setCancelContractReason("");
                            }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="danger"
                            isLoading={terminating}
                            disabled={!cancelContractReason.trim() || terminating}
                            onClick={handleConfirmCancelContract}
                        >
                            Tiến hành thanh lý
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}