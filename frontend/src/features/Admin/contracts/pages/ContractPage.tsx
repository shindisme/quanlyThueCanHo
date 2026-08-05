import { FileText } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
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
import ContractDocModal from "../components/ContractDocModal";
import ContractCreateModal from "../components/ContractCreateModal";
import CheckoutModal from "../components/CheckoutModal";
import { toast } from "sonner";
import { formatDate } from "../../../../utils/date";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { ContractTermination, ContractTerminationStatus, DepositPolicy, SettlementFinancialStatus } from "../../../../types/contractTermination";

const TERMINATION_TYPE_LABELS: Record<ContractTermination["type"], string> = {
    TENANT_REQUEST: "Khách yêu cầu trả phòng",
    OVERDUE: "Quản lý chủ động thanh lý",
};

const TERMINATION_STATUS_LABELS: Record<ContractTerminationStatus, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Đã từ chối",
    INSPECTION: "Đang kiểm tra phòng",
    SETTLING: "Đang quyết toán",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
};

const TERMINATION_STATUS_VARIANTS: Record<ContractTerminationStatus, BadgeVariant> = {
    PENDING: "warning",
    APPROVED: "info",
    REJECTED: "danger",
    INSPECTION: "warning",
    SETTLING: "info",
    COMPLETED: "success",
    CANCELLED: "gray",
};

const DEPOSIT_POLICY_LABELS: Record<DepositPolicy, string> = {
    REFUNDABLE: "Đủ điều kiện hoàn cọc",
    FORFEITED: "Không hoàn cọc",
};

const SETTLEMENT_STATUS_LABELS: Record<SettlementFinancialStatus, string> = {
    PENDING: "Chờ quyết toán",
    AWAITING_PAYMENT: "Chờ thanh toán",
    PARTIALLY_PAID: "Thanh toán một phần",
    SETTLED: "Đã tất toán",
};

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
        handleExtendContract,
        terminateItem,
        setTerminateItem,
        terminationItem,
        setTerminationItem,
        selectedTerminationDetail,
        setSelectedTerminationDetail,
        openTerminationsByContractId,
        overdueCandidateIds,
        handleApproveTermination,
        handleRejectTermination,
        handleCancelTermination,
        handleCreateOverdueTermination,
        handleOpenTerminationCheckout,
        cancelContractItem,
        setCancelContractItem,
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
    const terminationDetailContract = terminationDetail?.contract || (terminationDetail ? contracts.find((c) => c.id === terminationDetail.contract_id) : null);
    const terminationDetailApartment = terminationDetailContract?.apartment || (terminationDetailContract ? apartments.find((a) => a.id === terminationDetailContract.apartment_id) : null);
    const terminationDetailBuilding = terminationDetailApartment?.building || (terminationDetailApartment ? buildings.find((b) => b.id === terminationDetailApartment.building_id) : null);
    const terminationDetailTenant = terminationDetailContract?.tenant || (terminationDetailContract ? tenants.find((t) => t.id === terminationDetailContract.tenant_id) : null);
    const terminationRequester = terminationDetail?.requested_by ? users.find((u) => u.id === terminationDetail.requested_by) : null;
    const terminationApprover = terminationDetail?.approved_by ? users.find((u) => u.id === terminationDetail.approved_by) : null;
    const terminationDamages = terminationDetail?.damages || [];
    const terminationSettlement = terminationDetail?.settlement;
    const canCancelTerminationDetail = !!terminationDetail
        && (role === "ADMIN" || role === "MANAGER")
        && ["PENDING", "APPROVED", "INSPECTION", "SETTLING"].includes(terminationDetail.status);

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
                            { value: "ACTIVE", label: "Còn hiệu lực" },
                            { value: "ENDED", label: "Đã kết thúc" }
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
                        onCancelTermination={handleCancelTermination}
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
                onClose={() => {
                    setTerminateItem(null);
                    setTerminationItem(null);
                }}
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
                            <Badge variant="info">{TERMINATION_TYPE_LABELS[terminationDetail.type]}</Badge>
                            <Badge variant={TERMINATION_STATUS_VARIANTS[terminationDetail.status]}>
                                {TERMINATION_STATUS_LABELS[terminationDetail.status]}
                            </Badge>
                            <Badge variant={terminationDetail.deposit_policy === "REFUNDABLE" ? "success" : "warning"}>
                                {DEPOSIT_POLICY_LABELS[terminationDetail.deposit_policy]}
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

                        {terminationSettlement && (
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="font-bold text-gray-900">Quyết toán</h4>
                                    <Badge variant={terminationSettlement.financial_status === "SETTLED" ? "success" : "warning"}>
                                        {SETTLEMENT_STATUS_LABELS[terminationSettlement.financial_status]}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                    <p><span className="font-semibold">Cọc đã thu:</span> {formatMoney(terminationSettlement.deposit_paid)}</p>
                                    <p><span className="font-semibold">Cọc đủ điều kiện:</span> {formatMoney(terminationSettlement.eligible_deposit)}</p>
                                    <p><span className="font-semibold">Nợ còn lại:</span> {formatMoney(terminationSettlement.outstanding_debt)}</p>
                                    <p><span className="font-semibold">Tiền thuê cuối:</span> {formatMoney(terminationSettlement.final_rent)}</p>
                                    <p><span className="font-semibold">Điện/nước/dịch vụ:</span> {formatMoney(Number(terminationSettlement.final_electricity) + Number(terminationSettlement.final_water) + Number(terminationSettlement.final_service_fee))}</p>
                                    <p><span className="font-semibold">Phí khác:</span> {formatMoney(terminationSettlement.other_charges)}</p>
                                    <p><span className="font-semibold">Phí hư hỏng:</span> {formatMoney(terminationSettlement.damage_amount)}</p>
                                    <p><span className="font-semibold">Cọc đã khấu trừ:</span> {formatMoney(terminationSettlement.deposit_applied)}</p>
                                    <p><span className="font-semibold">Hoàn lại:</span> <span className="font-bold text-emerald-600">{formatMoney(terminationSettlement.refund_amount)}</span></p>
                                    <p><span className="font-semibold">Khách cần trả thêm:</span> <span className="font-bold text-red-600">{formatMoney(terminationSettlement.additional_amount_due)}</span></p>
                                </div>
                                {terminationSettlement.final_invoice && (
                                    <p className="rounded-lg bg-gray-50 p-3">
                                        <span className="font-semibold">Hóa đơn cuối:</span> {terminationSettlement.final_invoice.invoice_code} - {formatMoney(terminationSettlement.final_invoice.total_amount)}
                                    </p>
                                )}
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
                message="Bạn có chắc chắn muốn hủy tạo hợp đồng? Người thuê mới vừa tạo sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu."
                variant="danger"
                confirmText="Hủy tạo & Xóa"
                cancelText="Quay lại"
                isLoading={deletingTenant}
            />

            <ConfirmDialog
                isOpen={cancelContractItem !== null}
                onClose={() => setCancelContractItem(null)}
                onConfirm={handleConfirmCancelContract}
                title="Xác nhận Hủy hợp đồng (Chưa nhận phòng)"
                message={`Hợp đồng HD-${String(cancelContractItem?.id || 0).padStart(5, "0")} chưa đến ngày nhận phòng (${cancelContractItem?.start_date ? formatDate(cancelContractItem.start_date) : ""}). Bạn có chắc chắn muốn HỦY hợp đồng này không? Căn hộ sẽ lập tức được trả về trạng thái sẵn sàng cho thuê (AVAILABLE).`}
                variant="danger"
                confirmText="Hủy hợp đồng"
                cancelText="Quay lại"
                isLoading={terminating}
            />
        </div>
    );
}
