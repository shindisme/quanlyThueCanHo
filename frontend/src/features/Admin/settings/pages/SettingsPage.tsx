import { useEffect, useState } from "react";
import { Settings, Save, Zap, Droplet, Wifi, Landmark } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import Button from "../../../../components/ui/Button";
import { toast } from "sonner";

interface FeeSettings {
  electricityRates: number[];
  waterRates: number[];
  internetRate: number;
  managementFeePerM2: number;
}

type SavedFeeSettings = Partial<FeeSettings> & {
  electricityRate?: number;
  electricTierPrices?: number[];
  waterRate?: number;
  waterTierPrices?: number[];
};

const ELECTRIC_LABELS = [
  "Bậc 1 (0-50 kWh)",
  "Bậc 2 (51-100 kWh)",
  "Bậc 3 (101-200 kWh)",
  "Bậc 4 (201-300 kWh)",
  "Bậc 5 (301-400 kWh)",
  "Bậc 6 (Trên 400 kWh)",
];
const WATER_LABELS = [
  "Bậc 1 (0-4 m³/người)",
  "Bậc 2 (4-6 m³/người)",
  "Bậc 3 (trên 6 m³/người)",
];

const DEFAULT_FEES: FeeSettings = {
  electricityRates: [1984, 2050, 2380, 2998, 3350, 3460],
  waterRates: [6700, 12900, 14400],
  internetRate: 300000,
  managementFeePerM2: 10000,
};

const parseMoneyInput = (value: string) => Number(value.replace(/[^0-9]/g, ""));

const normalizeRates = (value: unknown, fallback: number[]) => {
  if (!Array.isArray(value) || value.length !== fallback.length) return fallback;
  const rates = value.map(Number);
  return rates.every(Number.isFinite) ? rates : fallback;
};

const normalizeFees = (saved: SavedFeeSettings): FeeSettings => ({
  electricityRates: normalizeRates(
    saved.electricityRates ?? saved.electricTierPrices,
    DEFAULT_FEES.electricityRates
  ),
  waterRates: normalizeRates(
    saved.waterRates ?? saved.waterTierPrices,
    DEFAULT_FEES.waterRates
  ),
  internetRate: saved.internetRate ?? DEFAULT_FEES.internetRate,
  managementFeePerM2: saved.managementFeePerM2 ?? DEFAULT_FEES.managementFeePerM2,
});

export default function SettingsPage() {
  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("system_fee_settings");
    if (!saved) return;

    try {
      setFees(normalizeFees(JSON.parse(saved)));
    } catch {
      setFees(DEFAULT_FEES);
    }
  }, []);

  const handleChange = (key: "internetRate" | "managementFeePerM2", value: string) => {
    const num = parseMoneyInput(value);
    setFees((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleTierChange = (key: "electricityRates" | "waterRates", index: number, value: string) => {
    const num = parseMoneyInput(value);
    setFees((prev) => ({
      ...prev,
      [key]: prev[key].map((rate, rateIndex) => (rateIndex === index ? num : rate)),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("system_fee_settings", JSON.stringify(fees));
      setSaving(false);
      toast.success("Cấu hình biểu phí dịch vụ đã được lưu thành công!");
    }, 600);
  };

  function formatCurrencyInput(val: number) {
    return new Intl.NumberFormat("vi-VN").format(val);
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Settings}
        title="Cấu hình hệ thống"
        subtitle="Quản lý biểu phí mặc định áp dụng khi lập hóa đơn cho toàn bộ các căn hộ"
        iconColor="linear-gradient(135deg, #4B5563, #9CA3AF)"
      />

      <div className="grid grid-cols-1 gap-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Biểu Phí Tiêu Dùng & Sinh Hoạt</h3>
                <p className="text-xs text-gray-400 mt-0.5">Cấu hình đơn giá dịch vụ điện, nước, internet và phí quản lý</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3 sm:col-span-2">
                <div className="flex items-center gap-2 text-primary-600">
                  <Zap size={20} className="fill-primary-50 text-primary-600" />
                  <span className="font-bold text-sm text-gray-800">Biểu giá điện 6 bậc</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fees.electricityRates.map((rate, index) => (
                    <label key={ELECTRIC_LABELS[index]} className="block space-y-1">
                      <span className="text-[11px] font-semibold text-gray-500">{ELECTRIC_LABELS[index]}</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={formatCurrencyInput(rate)}
                          onChange={(e) => handleTierChange("electricityRates", index, e.target.value)}
                          className="w-full rounded-xl border border-gray-250 p-3 pr-12 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/kWh</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3 sm:col-span-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Droplet size={20} className="fill-blue-50 text-blue-600" />
                  <span className="font-bold text-sm text-gray-800">Biểu giá nước sạch sinh hoạt</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {fees.waterRates.map((rate, index) => (
                    <label key={WATER_LABELS[index]} className="block space-y-1">
                      <span className="text-[11px] font-semibold text-gray-500">{WATER_LABELS[index]}</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={formatCurrencyInput(rate)}
                          onChange={(e) => handleTierChange("waterRates", index, e.target.value)}
                          className="w-full rounded-xl border border-gray-250 p-3 pr-12 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/m³</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Wifi size={20} className="fill-emerald-50 text-emerald-600" />
                  <span className="font-bold text-sm text-gray-800">Phí dịch vụ & Internet</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.internetRate)}
                    onChange={(e) => handleChange("internetRate", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-16 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/tháng</span>
                </div>
                <p className="text-[11px] text-gray-400">Chi phí gói dịch vụ mạng mặc định cố định theo phòng.</p>
              </div>


              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Landmark size={20} className="fill-indigo-50 text-indigo-650" />
                  <span className="font-bold text-sm text-gray-800">Phí quản lý theo m²</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.managementFeePerM2)}
                    onChange={(e) => handleChange("managementFeePerM2", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-16 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/m²/tháng</span>
                </div>
                <p className="text-[11px] text-gray-400">Phí quản lý tính trên mỗi mét vuông diện tích phòng.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
            >
              <Save size={18} />
              {saving ? "Đang lưu cấu hình..." : "Lưu cài đặt biểu phí"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}