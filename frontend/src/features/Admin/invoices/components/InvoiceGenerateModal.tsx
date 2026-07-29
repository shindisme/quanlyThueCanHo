import { useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import { toast } from "sonner";
import { readFeeSettings } from "../../../../utils/feeSettings";
import { formatCurrency } from "../../../../utils/currency";
import DatePicker from "../../../../components/ui/DatePicker";
import type { Building, GenerateMonthlyInvoicesPayload } from "../../../../types";

interface InvoiceGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: Building[];
  isGenerating: boolean;
  onGenerate: (payload: GenerateMonthlyInvoicesPayload) => void;
  role: string | null;
  managedBuildingId: number | null;
}

const ELECTRIC_LABELS = ["B1", "B2", "B3", "B4", "B5", "B6"];
const WATER_LABELS = ["B1", "B2", "B3"];

export default function InvoiceGenerateModal({
  isOpen,
  onClose,
  buildings,
  isGenerating,
  onGenerate,
  role,
  managedBuildingId,
}: InvoiceGenerateModalProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [buildingId, setBuildingId] = useState(
    role === "MANAGER" && managedBuildingId ? String(managedBuildingId) : ""
  );

  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  };
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [notify, setNotify] = useState(true);

  const feeSettings = readFeeSettings();

  const [managementFeePerM2, setManagementFeePerM2] = useState(() => String(feeSettings.managementFeePerM2));
  const [internetFee, setInternetFee] = useState(() => String(feeSettings.internetRate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      toast.error("Vui lòng chọn tòa nhà!");
      return;
    }

    const payload: GenerateMonthlyInvoicesPayload = {
      month: Number(month),
      year: Number(year),
      building_id: Number(buildingId),
      due_date: new Date(dueDate).toISOString(),
      management_fee_per_m2: Number(managementFeePerM2),
      electric_tier_prices: feeSettings.electricityRates,
      water_tier_prices: feeSettings.waterRates,
      internet_fee: Number(internetFee),
      notify,
    };
    onGenerate(payload);
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: `Năm ${y}` };
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tính Tiền & Tạo Hóa Đơn Hàng Tháng" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-sans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1 ">Tháng</label>
            <Combobox
              options={monthOptions}
              value={month}
              onChange={setMonth}
              triggerClassName="h-10.5 rounded-xl border-gray-300 px-4"
              clearable={true}
              searchable={false}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1 ">Năm</label>
            <Combobox
              options={yearOptions}
              value={year}
              onChange={setYear}
              triggerClassName="h-10.5 rounded-xl border-gray-300 px-4"
              clearable={true}
              searchable={false}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1 ">Tòa nhà</label>
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingId}
              onChange={setBuildingId}
              triggerClassName="h-10.5 rounded-xl border-gray-300 px-4 shadow-lg"
              placeholder="Chọn tòa nhà"
              clearable={true}
              disabled={role === "MANAGER"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1">Hạn thanh toán</label>
            <DatePicker
              value={dueDate}
              onChange={(date) => {
                if (date) {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setDueDate(`${y}-${m}-${d}`);
                } else {
                  setDueDate("");
                }
              }}
              placeholder="Chọn hạn thanh toán"
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-xs font-medium text-gray-700">Tự động gửi thông báo cho người thuê qua Email/Hệ thống</span>
            </label>
          </div>
        </div>

        {/* Biểu phí */}
        <div className="border border-gray-200 bg-gray-50/60 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
              Biểu phí áp dụng
            </h5>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="font-semibold text-gray-600 block mb-1">Điện 6 bậc (đ/kWh):</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 ">
                {feeSettings.electricityRates.map((rate, idx) => (
                  <div key={ELECTRIC_LABELS[idx]} className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center ">
                    <span className="text-[10px] text-gray-400 font-bold block">{ELECTRIC_LABELS[idx]}</span>
                    <span className="font-bold text-gray-800">{formatCurrency(rate)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-600 block mb-1">Nước 3 bậc (đ/m³):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {feeSettings.waterRates.map((rate, idx) => (
                  <div key={WATER_LABELS[idx]} className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block">{WATER_LABELS[idx]}</span>
                    <span className="font-bold text-gray-800">{formatCurrency(rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1 ">Phí dịch vụ & Internet (VND)</label>
              <Input
                type="number"
                value={internetFee}
                onChange={(e) => setInternetFee(e.target.value)}
                className="rounded-lg h-10.5 font-semibold bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1">Phí quản lý theo m² (VND / m²)</label>
              <Input
                type="number"
                value={managementFeePerM2}
                onChange={(e) => setManagementFeePerM2(e.target.value)}
                className="rounded-lg h-10.5 font-semibold bg-white"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isGenerating} className="rounded-xl">
            Huỷ bỏ
          </Button>
          <Button type="submit" disabled={isGenerating} className="rounded-xl">
            {isGenerating ? "Đang tính tiền..." : "Xác nhận & Tạo hóa đơn"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}