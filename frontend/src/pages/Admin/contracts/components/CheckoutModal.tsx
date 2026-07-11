import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import type { RentalContract } from "../../../../types";
import { formatCurrency } from "../../../../utils/currency";
import { createUtilityReading, getAllUtilityReadings } from "../../../../services/utilityService";
import { generateMonthlyInvoices, getAllInvoices } from "../../../../services/invoiceService";
import { toast } from "sonner";
import { Zap, Droplet, Receipt, ShieldCheck, HelpCircle } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentalContract | null;
  onConfirmCheckout: () => Promise<void> | void;
  isLoading: boolean;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  contract,
  onConfirmCheckout,
  isLoading: isTerminating,
}: CheckoutModalProps) {
  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(false);

  // Step 1 states: Utility Reading
  const [electricOld, setElectricOld] = useState(0);
  const [electricNew, setElectricNew] = useState(0);
  const [waterOld, setWaterOld] = useState(0);
  const [waterNew, setWaterNew] = useState(0);
  const [savingUtility, setSavingUtility] = useState(false);

  // Step 2 states: Invoice Generation
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Step 3 states: Deposit & Deductions
  const [unpaidAmount, setUnpaidAmount] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
  const [damageReason, setDamageReason] = useState("");

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Load old utility readings and unpaid invoices
  useEffect(() => {
    if (isOpen && contract) {
      setStep(1);
      setDamageFee(0);
      setDamageReason("");
      fetchInitialData();
    }
  }, [isOpen, contract]);

  const fetchInitialData = async () => {
    if (!contract) return;
    setLoadingData(true);
    try {
      // 1. Fetch latest utility reading to populate electricOld and waterOld
      const readingsRes = await getAllUtilityReadings({
        apartment_id: contract.apartment_id,
        limit: 1,
      });
      if (readingsRes.data && readingsRes.data.length > 0) {
        const latest = readingsRes.data[0];
        setElectricOld(latest.electric_new);
        setElectricNew(latest.electric_new);
        setWaterOld(latest.water_new);
        setWaterNew(latest.water_new);
      } else {
        setElectricOld(0);
        setElectricNew(0);
        setWaterOld(0);
        setWaterNew(0);
      }

      // 2. Fetch unpaid invoices
      await fetchUnpaidInvoices();
    } catch (err) {
      console.error("Error fetching checkout data:", err);
      toast.error("Không thể tải thông tin chỉ số hoặc hóa đơn cũ.");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchUnpaidInvoices = async () => {
    if (!contract) return;
    const invRes = await getAllInvoices({
      tenant_id: contract.tenant_id,
      status: "UNPAID",
    });
    const total = invRes.data.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    setUnpaidAmount(total);
  };

  // Step 1: Submit utility readings
  const handleSaveUtility = async () => {
    if (!contract) return;
    if (electricNew < electricOld) {
      toast.error("Chỉ số điện mới không được nhỏ hơn chỉ số cũ!");
      return;
    }
    if (waterNew < waterOld) {
      toast.error("Chỉ số nước mới không được nhỏ hơn chỉ số cũ!");
      return;
    }

    setSavingUtility(true);
    try {
      await createUtilityReading({
        apartment_id: contract.apartment_id,
        month: currentMonth,
        year: currentYear,
        electric_old: electricOld,
        electric_new: electricNew,
        water_old: waterOld,
        water_new: waterNew,
      });
      toast.success("Chốt điện nước phòng thành công!");
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể lưu chỉ số điện nước.");
    } finally {
      setSavingUtility(false);
    }
  };

  // Step 2: Generate monthly invoice
  const handleGenerateInvoice = async () => {
    if (!contract) return;
    setGeneratingInvoice(true);
    try {
      // Calculate due date as today + 7 days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      const dueDateString = dueDate.toISOString().split("T")[0];

      await generateMonthlyInvoices({
        month: currentMonth,
        year: currentYear,
        building_id: contract.apartment?.building_id || 0,
        due_date: dueDateString,
        notify: true,
      });

      toast.success("Khởi tạo hóa đơn cuối thành công!");
      // Re-fetch unpaid invoices to include this new invoice
      await fetchUnpaidInvoices();
      setStep(3);
    } catch (err: any) {
      // Fallback if invoice already exists or error
      console.error(err);
      toast.info("Đã có hóa đơn cho tháng này hoặc không thể tạo thêm hóa đơn.");
      await fetchUnpaidInvoices();
      setStep(3);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (!contract) return null;

  const deposit = Number(contract.deposit_amount);
  const totalDeductions = unpaidAmount + damageFee;
  const netRefund = deposit - totalDeductions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quy trình Trả phòng & Hủy hợp đồng: HD-${String(contract.id).padStart(5, "0")}`}
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-400">
            Bước {step} / 4
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={savingUtility || generatingInvoice || isTerminating}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            {step > 1 && step < 4 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={savingUtility || generatingInvoice}
                className="rounded-xl"
              >
                Quay lại
              </Button>
            )}
            {step === 1 && (
              <Button
                onClick={handleSaveUtility}
                disabled={savingUtility || loadingData}
                className="rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-bold"
              >
                {savingUtility ? "Đang lưu..." : "Chốt điện nước & Tiếp tục"}
              </Button>
            )}
            {step === 2 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50 font-medium"
                >
                  Bỏ qua bước tạo hóa đơn
                </Button>
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {generatingInvoice ? "Đang khởi tạo..." : "Tạo hóa đơn cuối & Tiếp tục"}
                </Button>
              </div>
            )}
            {step === 3 && (
              <Button
                onClick={() => setStep(4)}
                className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold"
              >
                Xác nhận đối trừ & Tiếp tục
              </Button>
            )}
            {step === 4 && (
              <Button
                onClick={onConfirmCheckout}
                disabled={isTerminating}
                className="rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold"
              >
                {isTerminating ? "Đang trả phòng..." : "Xác nhận Trả phòng & Giải phóng phòng"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={32} />
          <p className="text-sm text-gray-500 mt-2 font-sans">Đang tải thông tin hợp đồng và chỉ số cũ...</p>
        </div>
      ) : (
        <div className="space-y-6 font-sans text-sm">
          {/* Step Indicator Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-6">
              <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 1 ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"}`}>1</span>
              <span className="text-xs font-semibold text-gray-700">Chốt điện nước</span>
            </div>
            <div className="h-0.5 w-12 bg-gray-200 flex-1 mx-2" />
            <div className="flex items-center gap-6">
              <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 2 ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"}`}>2</span>
              <span className="text-xs font-semibold text-gray-700">Hóa đơn cuối</span>
            </div>
            <div className="h-0.5 w-12 bg-gray-200 flex-1 mx-2" />
            <div className="flex items-center gap-6">
              <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 3 ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"}`}>3</span>
              <span className="text-xs font-semibold text-gray-700">Đối trừ hoàn cọc</span>
            </div>
            <div className="h-0.5 w-12 bg-gray-200 flex-1 mx-2" />
            <div className="flex items-center gap-6">
              <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 4 ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}>4</span>
              <span className="text-xs font-semibold text-gray-700">Trả phòng</span>
            </div>
          </div>

          {/* STEP 1: UTILITY READINGS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-primary-50/50 p-4 border border-primary-100 rounded-xl space-y-1.5">
                <h4 className="font-bold text-primary-850 flex items-center gap-1.5 text-sm">
                  <Zap size={16} className="text-primary-600" />
                  Ghi nhận chỉ số điện nước cuối cùng
                </h4>
                <p className="text-xs text-primary-750">
                  Vui lòng kiểm tra và ghi lại số điện, nước trên công tơ phòng **P.{contract.apartment?.room_number || ""}** để hệ thống tính tiền lần cuối.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Electricity Section */}
                <div className="p-4 border border-gray-150 rounded-xl space-y-4 bg-gray-50/30">
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-xs uppercase tracking-wider">
                    <Zap size={14} className="text-amber-500" />
                    Chỉ số Điện (kWh)
                  </div>
                  <div>
                    <label className="text-xs text-gray-550 block mb-1">Chỉ số cũ gần nhất</label>
                    <Input type="number" value={electricOld} disabled className="bg-gray-100 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-550 block mb-1">Chỉ số mới chốt trả phòng *</label>
                    <Input
                      type="number"
                      value={electricNew}
                      onChange={(e) => setElectricNew(Number(e.target.value))}
                      className="font-bold text-amber-600"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Sản lượng tiêu thụ: <span className="font-bold text-gray-800">{Math.max(0, electricNew - electricOld)} kWh</span>
                  </div>
                </div>

                {/* Water Section */}
                <div className="p-4 border border-gray-150 rounded-xl space-y-4 bg-gray-50/30">
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-xs uppercase tracking-wider">
                    <Droplet size={14} className="text-blue-500" />
                    Chỉ số Nước (m³)
                  </div>
                  <div>
                    <label className="text-xs text-gray-550 block mb-1">Chỉ số cũ gần nhất</label>
                    <Input type="number" value={waterOld} disabled className="bg-gray-100 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-550 block mb-1">Chỉ số mới chốt trả phòng *</label>
                    <Input
                      type="number"
                      value={waterNew}
                      onChange={(e) => setWaterNew(Number(e.target.value))}
                      className="font-bold text-blue-600"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Sản lượng tiêu thụ: <span className="font-bold text-gray-800">{Math.max(0, waterNew - waterOld)} m³</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GENERATE FINAL INVOICE */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1.5">
                <h4 className="font-bold text-emerald-850 flex items-center gap-1.5 text-sm">
                  <Receipt size={16} className="text-emerald-600" />
                  Tạo hóa đơn tháng cuối cùng
                </h4>
                <p className="text-xs text-emerald-700">
                  Hệ thống sẽ chạy bộ tính cước tự động dựa trên chỉ số điện nước vừa nhập để tạo hóa đơn tiền nhà + tiền điện nước của tháng này cho khách thuê.
                </p>
              </div>

              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/30 space-y-3">
                <h5 className="font-bold text-gray-800">Tóm tắt tiêu thụ chốt phòng:</h5>
                <ul className="space-y-2 text-xs text-gray-650">
                  <li className="flex justify-between">
                    <span>Số điện tiêu dùng:</span>
                    <span className="font-semibold text-gray-850">{electricNew - electricOld} kWh</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Số nước tiêu dùng:</span>
                    <span className="font-semibold text-gray-850">{waterNew - waterOld} m³</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Tháng tính tiền:</span>
                    <span className="font-semibold text-gray-850">Tháng {currentMonth} / {currentYear}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 3: DEPOSIT REFUND CALCULATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
                <h4 className="font-bold text-gray-800 text-sm">Tính toán đối trừ công nợ & hoàn cọc</h4>
                <p className="text-xs text-gray-500">
                  Tiền cọc của khách sẽ được cấn trừ cho các hóa đơn chưa trả và các chi phí hao tổn phòng (nếu có).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs area */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-650 block mb-1">Tổng nợ hóa đơn chưa thanh toán (VND)</label>
                    <Input type="text" value={formatCurrency(unpaidAmount)} disabled className="bg-gray-100 font-bold text-red-600" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-650 block mb-1">Phí đền bù hư hỏng / tổn hại (VND)</label>
                    <Input
                      type="number"
                      value={damageFee}
                      onChange={(e) => setDamageFee(Number(e.target.value))}
                      className="font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-650 block mb-1">Lý do phạt đền bù (nếu có)</label>
                    <textarea
                      value={damageReason}
                      onChange={(e) => setDamageReason(e.target.value)}
                      placeholder="Ví dụ: Làm hỏng vòi nước, bẩn tường..."
                      className="w-full rounded-lg border-gray-300 p-2 text-xs focus:ring-primary-500 focus:border-primary-500 min-h-[60px]"
                    />
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col justify-between">
                  <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Chi tiết thanh toán</h5>
                  <div className="space-y-2.5 text-xs text-gray-650 flex-1">
                    <div className="flex justify-between">
                      <span>Tiền đặt cọc gốc:</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(deposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cấn trừ nợ hóa đơn:</span>
                      <span className="font-semibold text-red-650">-{formatCurrency(unpaidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-250 pb-2">
                      <span>Phí hao tổn đền bù:</span>
                      <span className="font-semibold text-red-650">-{formatCurrency(damageFee)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-bold text-sm">
                      <span className="text-gray-850">Tiền thực tế hoàn lại:</span>
                      <span className={netRefund >= 0 ? "text-emerald-600 text-base" : "text-red-600 text-base"}>
                        {formatCurrency(netRefund)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-gray-450 text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Mọi khoản đối trừ được lập biên bản để xác nhận với khách thuê.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FINAL TERMINATE CONTRACT */}
          {step === 4 && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <HelpCircle size={28} />
                </div>
                <h4 className="text-base font-bold text-gray-850">Xác nhận hoàn tất trả phòng & Kết thúc hợp đồng?</h4>
                <p className="text-xs text-gray-550 max-w-md">
                  Sau khi xác nhận, hợp đồng thuê **HD-{String(contract.id).padStart(5, "0")}** sẽ chính thức chuyển sang trạng thái **Đã kết thúc (ENDED)**. Căn hộ **P.{contract.apartment?.room_number || ""}** sẽ tự động được giải phóng thành **Còn trống (AVAILABLE)** để đón khách thuê tiếp theo.
                </p>
              </div>

              <div className="p-4 border border-red-100 rounded-xl bg-red-50/20 max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Khách thuê:</span>
                  <span className="font-bold text-gray-800">{contract.tenant?.full_name || ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Căn hộ:</span>
                  <span className="font-bold text-gray-800">P.{contract.apartment?.room_number || ""} ({contract.apartment?.building?.branch_name || ""})</span>
                </div>
                <div className="flex justify-between border-t border-red-100/50 pt-2 font-semibold">
                  <span className="text-gray-700">Tiền hoàn trả:</span>
                  <span className={netRefund >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                    {formatCurrency(netRefund)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
