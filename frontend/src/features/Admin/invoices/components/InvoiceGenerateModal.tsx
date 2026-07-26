import { useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import { toast } from "sonner";

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

const DEFAULT_ELECTRIC_TIER_PRICES = [1984, 2050, 2380, 2998, 3350, 3460];
const DEFAULT_WATER_TIER_PRICES = [6700, 12900, 14400];
const ELECTRIC_LABELS = ["B1", "B2", "B3", "B4", "B5", "B6"];
const WATER_LABELS = ["B1", "B2", "B3"];

type SavedFeeSettings = {
  managementFeePerM2?: number;
  internetRate?: number;
  electricityRates?: number[];
  electricTierPrices?: number[];
  waterRates?: number[];
  waterTierPrices?: number[];
};

const readSavedFees = (): SavedFeeSettings => {
  try {
    const saved = localStorage.getItem("system_fee_settings");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const readSavedNumber = (key: keyof SavedFeeSettings, fallback: number) => {
  const value = readSavedFees()[key];
  return typeof value === "number" && Number.isFinite(value) ? String(value) : String(fallback);
};

const readSavedRates = (keys: Array<keyof SavedFeeSettings>, fallback: number[]) => {
  const saved = readSavedFees();
  const value = keys.map((key) => saved[key]).find(Array.isArray);
  if (!Array.isArray(value) || value.length !== fallback.length) return fallback.map(String);

  const rates = value.map(Number);
  return rates.every(Number.isFinite) ? rates.map(String) : fallback.map(String);
};

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

  const [managementFeePerM2, setManagementFeePerM2] = useState(() => readSavedNumber("managementFeePerM2", 10000));
  const [electricTierPrices, setElectricTierPrices] = useState(() =>
    readSavedRates(["electricityRates", "electricTierPrices"], DEFAULT_ELECTRIC_TIER_PRICES)
  );
  const [waterTierPrices, setWaterTierPrices] = useState(() =>
    readSavedRates(["waterRates", "waterTierPrices"], DEFAULT_WATER_TIER_PRICES)
  );
  const [internetFee, setInternetFee] = useState(() => readSavedNumber("internetRate", 300000));
  const [notify, setNotify] = useState(true);

  const handleTierChange = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((rate, rateIndex) => (rateIndex === index ? value : rate)));
  };

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
      electric_tier_prices: electricTierPrices.map(Number),
      water_tier_prices: waterTierPrices.map(Number),
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
            <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Tháng</label>
            <Combobox
              options={monthOptions}
              value={month}
              onChange={setMonth}
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-4"
              clearable={false}
              searchable={false}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Năm</label>
            <Combobox
              options={yearOptions}
              value={year}
              onChange={setYear}
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-4"
              clearable={false}
              searchable={false}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Chi nhánh / Tòa nhà</label>
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingId}
              onChange={setBuildingId}
              triggerClassName="h-[42px] rounded-lg border-gray-300 px-4"
              placeholder="Chọn tòa nhà"
              clearable={false}
              disabled={role === "MANAGER"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Hạn thanh toán</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg h-[42px]"
              required
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
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

        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Cấu hình đơn giá dịch vụ áp dụng</h5>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-2 select-none">Biểu giá điện 6 bậc (VND / kWh)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {electricTierPrices.map((price, index) => (
                  <Input
                    key={ELECTRIC_LABELS[index]}
                    type="number"
                    value={price}
                    onChange={(e) => handleTierChange(setElectricTierPrices, index, e.target.value)}
                    className="rounded-lg h-[42px] font-semibold"
                    aria-label={`Đơn giá điện ${ELECTRIC_LABELS[index]}`}
                    required
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-2 select-none">Biểu giá nước 3 bậc (VND / m³/người)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {waterTierPrices.map((price, index) => (
                  <Input
                    key={WATER_LABELS[index]}
                    type="number"
                    value={price}
                    onChange={(e) => handleTierChange(setWaterTierPrices, index, e.target.value)}
                    className="rounded-lg h-[42px] font-semibold"
                    aria-label={`Đơn giá nước ${WATER_LABELS[index]}`}
                    required
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Phí dịch vụ & Internet (VND)</label>
                <Input
                  type="number"
                  value={internetFee}
                  onChange={(e) => setInternetFee(e.target.value)}
                  className="rounded-lg h-[42px] font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Phí quản lý theo m² (VND / m²)</label>
                <Input
                  type="number"
                  value={managementFeePerM2}
                  onChange={(e) => setManagementFeePerM2(e.target.value)}
                  className="rounded-lg h-10.5 font-semibold"
                  required
                />
              </div>
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