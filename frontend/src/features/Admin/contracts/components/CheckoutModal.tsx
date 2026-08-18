import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import CurrencyInput from "../../../../components/ui/CurrencyInput";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { ContractTermination, RentalContract } from "../../../../types";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import { Check, Plus, Trash2 } from "lucide-react";
import { useCheckout, CheckoutStep } from "../hooks/useCheckout";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: (options?: { completed?: boolean }) => void;
    contract: RentalContract | null;
    termination: ContractTermination | null;
    isLoading: boolean;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    contract,
    termination,
    isLoading: isTerminating,
}: CheckoutModalProps) {
    const {
        step,
        setStep,
        loadingData,
        isProcessing: isHookProcessing,
        utilityForm: {
            electricOld,
            electricOldInput,
            electricNew,
            electricNewInput,
            setElectricNewInput,
            waterOld,
            waterOldInput,
            waterNew,
            waterNewInput,
            setWaterNewInput,
            electricConsumption,
            waterConsumption,
            isUtilitySaved,
            electricError,
            waterError,
            isUtilityValid,
        },
        financial: {
            deposit,
            unpaidAmount,
            unpaidInvoices,
            netRefund,
            settlementPreview,
            depositPolicy,
        },
        damageForm: {
            damageItems,
            damageError,
            setDamageDescription,
            setDamageAmount,
            addDamageItem,
            removeDamageItem,
        },
        dialogs: {
            highConsumption,
            terminateConfirm,
        },
        actions: {
            executeSaveUtility,
            handleSaveUtility,
            handleGenerateInvoice,
            handleDepositPolicyChange,
            handleCompleteHandover,
        },
        meta: {
            currentMonth,
            currentYear,
            hasGeneratedInvoice,
            savingUtility,
            generatingInvoice,
            completingHandover,
        },
    } = useCheckout({
        contract,
        termination,
        isOpen,
        onClose,
    });

    const isProcessing = isHookProcessing || isTerminating;
    const finalRentAmount = Number(settlementPreview?.final_rent ?? 0);
    const finalElectricityAmount = Number(settlementPreview?.final_electricity ?? 0);
    const finalWaterAmount = Number(settlementPreview?.final_water ?? 0);
    const finalServiceFeeAmount = Number(settlementPreview?.final_service_fee ?? 0);
    const otherChargesAmount = Number(settlementPreview?.other_charges ?? 0);
    const damageAmount = Number(settlementPreview?.damage_amount ?? 0);

    const renderMoneyRow = (
        label: string,
        amount: number,
        tone: "charge" | "credit" | "neutral" | "held" = "charge"
    ) => {
        const sign = tone === "charge" ? "-" : tone === "credit" ? "+" : "";
        const textClass = tone === "charge"
            ? "text-red-600"
            : tone === "credit"
                ? "text-emerald-700"
                : tone === "held"
                    ? "text-amber-700"
                    : "text-slate-800";

        return (
            <div className="p-3 flex justify-between gap-3 border-b border-slate-100">
                <span className={`${textClass} font-medium`}>{label}</span>
                <span className={`${textClass} font-bold text-right whitespace-nowrap`}>{sign}{formatCurrency(amount)}</span>
            </div>
        );
    };

    const renderStepBadge = (stepNum: CheckoutStep, label: string) => {
        const isDone = step > stepNum;
        const isActive = step === stepNum;
        return (
            <div className="flex items-center gap-2">
                <span
                    className={`w-7 h-7 flex items-center justify-center font-bold text-xs border rounded-full ${isDone
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : isActive
                            ? "bg-primary-600 text-white border-primary-600"
                            : "bg-gray-100 text-gray-400 border-gray-200"
                        }`}
                >
                    {isDone ? <Check size={14} /> : stepNum}
                </span>
                <span className={`text-xs font-semibold ${isActive ? "text-primary-700 font-bold" : isDone ? "text-emerald-700" : "text-gray-500"}`}>
                    {label}
                </span>
            </div>
        );
    };

    const renderStepLine = (fromStep: CheckoutStep) => {
        const isPassed = step > fromStep;
        return <div className={`h-0.5 w-8 flex-1 mx-2 transition-all ${isPassed ? "bg-emerald-600" : "bg-gray-200"}`} />;
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !!contract}
                onClose={() => onClose()}
                title={`Thanh lý Hợp đồng: HD-${String(contract?.id || 0).padStart(5, "0")}`}
                size="lg"
                footer={
                    <div className="flex flex-wrap gap-2 justify-end w-full">
                        <Button
                            variant="outline"
                            onClick={() => onClose()}
                            disabled={isProcessing}
                        >
                            Hủy bỏ
                        </Button>
                        {step > CheckoutStep.UTILITY && (
                            <Button
                                variant="outline"
                                onClick={() => setStep((step - 1) as CheckoutStep)}
                                disabled={isProcessing}
                            >
                                Quay lại
                            </Button>
                        )}
                        {step === CheckoutStep.UTILITY && (
                            <Button
                                onClick={handleSaveUtility}
                                disabled={isProcessing || loadingData || !isUtilityValid}
                                className="bg-primary-600 text-white hover:bg-primary-700 font-bold"
                            >
                                {savingUtility ? "Đang lưu..." : "Chốt & Tiếp tục"}
                            </Button>
                        )}
                        {step === CheckoutStep.INVOICE && (
                            <Button
                                onClick={handleGenerateInvoice}
                                disabled={isProcessing || !!damageError}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                {generatingInvoice ? "Đang tính..." : "Tính quyết toán"}
                            </Button>
                        )}
                        {step === CheckoutStep.DEPOSIT && (
                            <Button
                                onClick={() => setStep(CheckoutStep.CONFIRM)}
                                disabled={isProcessing}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold"
                            >
                                Xác nhận đối trừ
                            </Button>
                        )}
                        {step === CheckoutStep.CONFIRM && (
                            <Button
                                onClick={() => terminateConfirm.setIsOpen(true)}
                                disabled={isProcessing}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                {completingHandover ? "Đang xử lý..." : "Hoàn tất trả phòng"}
                            </Button>
                        )}
                    </div>
                }
            >
                {loadingData ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <LoadingSpinner size={32} />
                        <p className="text-sm text-gray-500 mt-2 font-sans">Đang tải thông tin hợp đồng và chỉ số cũ...</p>
                    </div>
                ) : (
                    <div className="relative space-y-6 font-sans text-sm">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center">
                                <LoadingSpinner size={36} />
                                <span className="text-xs font-bold text-gray-700 mt-2">
                                    {savingUtility ? "Đang ghi nhận chỉ số..." : generatingInvoice ? "Đang tính quyết toán..." : "Đang xử lý kết thúc..."}
                                </span>
                            </div>
                        )}

                        {/* Thanh điều hướng các bước */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 overflow-x-auto">
                            {renderStepBadge(1, "Chốt điện nước")}
                            {renderStepLine(1)}
                            {renderStepBadge(2, "Quyết toán")}
                            {renderStepLine(2)}
                            {renderStepBadge(3, "Đối trừ cọc")}
                            {renderStepLine(3)}
                            {renderStepBadge(4, "Hoàn tất")}
                        </div>

                        {/* Step 1: Chốt điện nước */}
                        {step === CheckoutStep.UTILITY && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 border border-slate-200 space-y-1.5 flex flex-col sm:flex-row justify-between items-start gap-2">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                                            Ghi nhận chỉ số điện nước chốt phòng
                                        </h4>
                                        <p className="text-xs text-slate-600">
                                            Kiểm tra và ghi lại số điện, nước trên công tơ phòng{" "}
                                            <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 border border-purple-200">
                                                {contract?.apartment
                                                    ? formatApartmentDisplay(contract.apartment.room_number, contract.apartment.floor)
                                                    : "Phòng"}
                                            </span>{" "}
                                            để hệ thống tính cước trả phòng.
                                        </p>
                                    </div>
                                    {isUtilitySaved && (
                                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-bold flex items-center gap-1 shrink-0 border border-emerald-200">
                                            Đã lưu chỉ số
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {/* Khu vực chỉ số điện */}
                                    <div className="p-4 border border-amber-200 space-y-4 bg-amber-50">
                                        <div className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                                            Chỉ số Điện (kWh)
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block mb-1">Chỉ số cũ gần nhất (không thể sửa)</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={99999}
                                                value={electricOldInput ?? electricOld}
                                                disabled={true}
                                                readOnly={true}
                                                className="font-bold text-slate-500 bg-slate-100 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block mb-1">Chỉ số mới chốt trả phòng *</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={99999}
                                                value={electricNewInput ?? electricNew}
                                                onChange={(e) => setElectricNewInput(e.target.value)}
                                                className="font-bold text-slate-900"
                                            />
                                            {electricError && (
                                                <p className="text-xs text-red-600 font-medium mt-1">{electricError}</p>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 flex justify-between items-center border border-slate-200">
                                            <span>Sản lượng tiêu thụ:</span>
                                            <span className="font-bold text-amber-600 text-sm">
                                                {electricConsumption === 0 ? "Không phát sinh" : `${electricConsumption} kWh`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Khu vực chỉ số nước */}
                                    <div className="p-4 border border-blue-200 space-y-4 bg-blue-50">
                                        <div className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                                            Chỉ số Nước (m³)
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block mb-1">Chỉ số cũ gần nhất (không thể sửa)</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={99999}
                                                value={waterOldInput ?? waterOld}
                                                disabled={true}
                                                readOnly={true}
                                                className="font-bold text-slate-500 bg-slate-100 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block mb-1">Chỉ số mới chốt trả phòng *</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={99999}
                                                value={waterNewInput ?? waterNew}
                                                onChange={(e) => setWaterNewInput(e.target.value)}
                                                className="font-bold text-slate-900"
                                            />
                                            {waterError && (
                                                <p className="text-xs text-red-600 font-medium mt-1">{waterError}</p>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 flex justify-between items-center border border-slate-200">
                                            <span>Sản lượng tiêu thụ:</span>
                                            <span className="font-bold text-blue-700 text-sm">
                                                {waterConsumption === 0 ? "Không phát sinh" : `${waterConsumption} m³`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Tạo hóa đơn tháng cuối */}
                        {step === CheckoutStep.INVOICE && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                                    <h4 className="font-bold text-slate-800 text-sm">
                                        Tính quyết toán thanh lý tháng {currentMonth}/{currentYear}
                                    </h4>
                                </div>

                                {/* Hóa đơn tháng cuối */}
                                <div className="bg-white border border-slate-200 p-4 space-y-2">
                                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Khoản quyết toán sẽ bao gồm:</h5>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                                        <li className="flex items-center gap-1.5 font-medium"><Check size={14} className="text-emerald-600 shrink-0" /> Tiền điện ({electricConsumption} kWh)</li>
                                        <li className="flex items-center gap-1.5 font-medium"><Check size={14} className="text-emerald-600 shrink-0" /> Tiền nước ({waterConsumption} m³)</li>
                                        <li className="flex items-center gap-1.5 font-medium"><Check size={14} className="text-emerald-600 shrink-0" /> Tiền thuê nhà tháng cuối</li>
                                        <li className="flex items-center gap-1.5 font-medium"><Check size={14} className="text-emerald-600 shrink-0" /> Phí dịch vụ định kỳ & phát sinh</li>
                                    </ul>
                                </div>

                                <div className="p-4 border border-slate-200 bg-slate-50 space-y-3">
                                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Tóm tắt tiêu thụ:</h5>
                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="p-3 bg-white border border-slate-200 text-center space-y-1">
                                            <span className="text-slate-500 block">Số điện tiêu dùng</span>
                                            <span className="font-bold text-amber-600 text-sm">{electricConsumption} kWh</span>
                                        </div>
                                        <div className="p-3 bg-white border border-slate-200 text-center space-y-1">
                                            <span className="text-slate-500 block">Số nước tiêu dùng</span>
                                            <span className="font-bold text-blue-700 text-sm">{waterConsumption} m³</span>
                                        </div>
                                        <div className="p-3 bg-white border border-slate-200 text-center space-y-1">
                                            <span className="text-slate-500 block">Kỳ cước</span>
                                            <span className="font-bold text-slate-800 text-sm">Tháng {currentMonth}/{currentYear}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cơ sở vật chất bị hư hại</h5>
                                        <Button variant="outline" size="sm" onClick={addDamageItem} disabled={isProcessing}>
                                            <Plus size={14} /> Thêm hư hại
                                        </Button>
                                    </div>

                                    {damageItems.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">Chưa ghi nhận cơ sở vật chất hư hại.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {damageItems.map((item, index) => (
                                                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_40px] gap-2 items-start">
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => setDamageDescription(index, e.target.value)}
                                                        placeholder="Tên cơ sở vật chất"
                                                        disabled={isProcessing}
                                                    />
                                                    <CurrencyInput
                                                        value={item.amount || 0}
                                                        onChange={(val) => setDamageAmount(index, val)}
                                                        disabled={isProcessing}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDamageItem(index)}
                                                        disabled={isProcessing}
                                                        className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-60"
                                                        title="Xóa hư hại"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {damageError && <p className="text-xs font-semibold text-red-600">{damageError}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Đối trừ công nợ vs hoàn cọc */}
                        {step === CheckoutStep.DEPOSIT && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 border border-slate-200 p-4 space-y-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Tính toán đối trừ công nợ & hoàn cọc</h4>
                                </div>

                                <div className="border border-slate-200 p-3 bg-white space-y-3">
                                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Chính sách đối trừ cọc</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDepositPolicyChange("REFUNDABLE")}
                                            disabled={isProcessing}
                                            className={`h-11 rounded-lg border px-3 text-sm font-bold transition-colors ${depositPolicy === "REFUNDABLE" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            Hoàn cọc
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDepositPolicyChange("FORFEITED")}
                                            disabled={isProcessing}
                                            className={`h-11 rounded-lg border px-3 text-sm font-bold transition-colors ${depositPolicy === "FORFEITED" ? "border-red-600 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            Không hoàn cọc
                                        </button>
                                    </div>
                                </div>
                                {/* Danh sách tất cả các hóa đơn chưa thanh toán */}
                                <div className="border border-slate-200 p-3 bg-white space-y-2">
                                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                        Danh sách hóa đơn chưa thanh toán ({unpaidInvoices.length} HĐ):
                                    </h5>
                                    {unpaidInvoices.length === 0 ? (
                                        <p className="text-xs text-emerald-600 italic">Không có hóa đơn chưa thanh toán nào tồn đọng.</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                            {unpaidInvoices.map((inv) => (
                                                <div key={inv.id} className="py-2 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold text-slate-800">{inv.invoice_code}</span>
                                                        <span className="text-slate-500 ml-2">
                                                            ({inv.type === "MONTHLY"
                                                                ? "Hóa đơn tháng"
                                                                : inv.type === "FIRST_RENT"
                                                                    ? "Tiền nhà đầu kỳ"
                                                                    : inv.type === "MAINTENANCE"
                                                                        ? "Chi phí sửa chữa"
                                                                        : "Hóa đơn dịch vụ"})
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-rose-600">-{formatCurrency(Number(inv.total_amount))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bảng chi tiết phép tính đối trừ tài chính */}
                                <div className="border border-slate-200 text-xs bg-white">
                                    <div className="p-3 bg-slate-100 font-bold text-slate-700 flex justify-between border-b border-slate-200">
                                        <span>Chi tiết phép tính tài chính đối trừ</span>
                                        <span>Số tiền (VNĐ)</span>
                                    </div>
                                    {depositPolicy === "REFUNDABLE"
                                        ? renderMoneyRow("Tiền đặt cọc hoàn lại", deposit, "credit")
                                        : renderMoneyRow("Tiền đặt cọc ban đầu", deposit, "neutral")}
                                    {depositPolicy === "FORFEITED" && renderMoneyRow("Tiền cọc bị giữ, không hoàn lại", deposit, "held")}
                                    {unpaidAmount > 0 && renderMoneyRow(`Tổng hóa đơn chưa thanh toán (${unpaidInvoices.length} HĐ)`, unpaidAmount)}
                                    {finalElectricityAmount > 0 && renderMoneyRow(`Tiền điện chốt (${electricConsumption} kWh)`, finalElectricityAmount)}
                                    {finalWaterAmount > 0 && renderMoneyRow(`Tiền nước chốt (${waterConsumption} m³)`, finalWaterAmount)}
                                    {finalRentAmount > 0 && renderMoneyRow("Tiền thuê tháng cuối", finalRentAmount)}
                                    {finalServiceFeeAmount > 0 && renderMoneyRow("Phí dịch vụ", finalServiceFeeAmount)}
                                    {otherChargesAmount > 0 && renderMoneyRow("Khoản khác", otherChargesAmount)}
                                    {damageAmount > 0 && renderMoneyRow("Cơ sở vật chất hư hại", damageAmount)}
                                    <div className={`p-4 flex justify-between items-center font-bold text-sm ${netRefund >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                                        <span>Thành tiền</span>
                                        <span className="text-lg font-extrabold">{netRefund >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netRefund))}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Hoàn tất */}
                        {step === CheckoutStep.CONFIRM && (
                            <div className="space-y-4 py-1">
                                <div className="bg-slate-50 border border-slate-200 p-4 space-y-1">
                                    <h6 className="text-xs text-slate-600">Vui lòng rà soát lại toàn bộ thông tin bên dưới trước khi bấm hoàn tất trả phòng.</h6>
                                </div>

                                <div className="border border-slate-200 divide-y divide-slate-100 bg-white text-xs">
                                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Mã Hợp Đồng</span>
                                            <span className="font-bold text-slate-900">HD-{String(contract?.id || 0).padStart(5, "0")}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Phòng & Chi nhánh</span>
                                            <span className="font-bold text-purple-700">
                                                {formatApartmentDisplay(contract?.apartment?.room_number || "", contract?.apartment?.floor || 0)}{" "}
                                                {contract?.apartment?.building?.branch_name ? `(${contract.apartment.building.branch_name})` : ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Khách thuê</span>
                                            <span className="font-bold text-slate-900">{contract?.tenant?.full_name || ""}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Trạng thái Hóa đơn tháng cuối</span>
                                            {hasGeneratedInvoice ? (
                                                <span className="font-bold text-emerald-600">✓ Đã tính quyết toán</span>
                                            ) : (
                                                <span className="font-semibold text-slate-500">Chưa tính</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50">
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">
                                                Điện chốt ({electricConsumption === 0 ? "không phát sinh" : `${electricConsumption} kWh`})
                                            </span>
                                            <span className="font-semibold text-slate-800">{electricOld} → {electricNew}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">
                                                Nước chốt ({waterConsumption === 0 ? "không phát sinh" : `${waterConsumption} m³`})
                                            </span>
                                            <span className="font-semibold text-slate-800">{waterOld} → {waterNew}</span>
                                        </div>
                                    </div>

                                    {damageAmount > 0 && (
                                        <div className="p-3.5 bg-red-50">
                                            <span className="text-slate-500 block mb-1">Cơ sở vật chất hư hại</span>
                                            <div className="space-y-1">
                                                {damageItems.filter((item) => item.description.trim() || Number(item.amount) > 0).map((item, index) => (
                                                    <div key={index} className="flex justify-between gap-3 text-xs">
                                                        <span className="font-semibold text-slate-800">{item.description || "Chưa nhập tên"}</span>
                                                        <span className="font-bold text-red-600">{formatCurrency(Number(item.amount || 0))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <span className="text-slate-600 font-medium">Kết quả đối trừ cuối cùng:</span>
                                        <div className="text-left sm:text-right">
                                            <span className="text-xs text-slate-500 block">Thành tiền:</span>
                                            <span className={`text-base font-extrabold ${netRefund >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                {netRefund >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netRefund))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>


            <ConfirmDialog
                isOpen={highConsumption.isOpen}
                onClose={() => highConsumption.setIsOpen(false)}
                onConfirm={async () => {
                    highConsumption.setIsOpen(false);
                    await executeSaveUtility();
                }}
                title="Cảnh báo sản lượng tiêu thụ cao"
                message={`Sản lượng tiêu thụ ghi nhận được rất cao (${electricConsumption} kWh điện / ${waterConsumption} m³ nước). Bạn có chắc chắn số liệu chốt trên công tơ là chính xác?`}
                variant="warning"
                confirmText="Xác nhận số liệu đúng"
                cancelText="Quay lại kiểm tra"
            />

            <ConfirmDialog
                isOpen={terminateConfirm.isOpen}
                onClose={() => terminateConfirm.setIsOpen(false)}
                onConfirm={async () => {
                    terminateConfirm.setIsOpen(false);
                    await handleCompleteHandover();
                }}
                title="Xác nhận Hoàn tất trả phòng"
                message={`Hợp đồng HD-${String(contract?.id || 0).padStart(5, "0")} sẽ chính thức KẾT THÚC. Căn hộ P.${contract?.apartment?.floor || ""}${contract?.apartment?.room_number || ""} sẽ chuyển sang trạng thái SẴN SÀNG CHO THUÊ. Bạn có chắc chắn muốn hoàn tất?`}
                variant="danger"
                confirmText="Hoàn tất trả phòng"
                cancelText="Quay lại"
                isLoading={isTerminating || completingHandover}
            />
        </>
    );
}



