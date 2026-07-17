import { useState, useEffect } from "react";
import { Settings, Save, Zap, Droplet, Wifi, Landmark } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import { toast } from "sonner";

interface FeeSettings {
  electricityRate: number;
  waterRate: number;
  internetRate: number;
  managementFee: number;
  managementFeePerM2: number;
  motorbikeParkingRate: number;
  carParkingRate: number;
}

const DEFAULT_FEES: FeeSettings = {
  electricityRate: 3500,
  waterRate: 25000,
  internetRate: 300000,
  managementFee: 0,
  managementFeePerM2: 10000,
  motorbikeParkingRate: 100000,
  carParkingRate: 1000000,
};

export default function SettingsPage() {
  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("system_fee_settings");
    if (saved) {
      try {
        setFees({ ...DEFAULT_FEES, ...JSON.parse(saved) });
      } catch {
        setFees(DEFAULT_FEES);
      }
    }
  }, []);

  const handleChange = (key: keyof FeeSettings, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    setFees((prev) => ({
      ...prev,
      [key]: num,
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

      <div className="grid grid-cols-1  gap-6">
        {/* Left Form Column */}
        <form onSubmit={handleSave} className=" space-y-6">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Biểu Phí Tiêu Dùng & Sinh Hoạt</h3>
                <p className="text-xs text-gray-400 mt-0.5">Cấu hình đơn giá dịch vụ điện, nước, internet và phí quản lý</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Electricity */}
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <div className="flex items-center gap-2 text-primary-600">
                  <Zap size={20} className="fill-primary-50 text-primary-600" />
                  <span className="font-bold text-sm text-gray-800">Đơn giá điện</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.electricityRate)}
                    onChange={(e) => handleChange("electricityRate", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-12 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/kWh</span>
                </div>
                <p className="text-[11px] text-gray-400">Đơn giá thu trên mỗi số điện tiêu dùng thực tế.</p>
              </div>

              {/* Water */}
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Droplet size={20} className="fill-blue-50 text-blue-600" />
                  <span className="font-bold text-sm text-gray-800">Đơn giá nước</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.waterRate)}
                    onChange={(e) => handleChange("waterRate", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-12 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/m³</span>
                </div>
                <p className="text-[11px] text-gray-400">Đơn giá tính trên mỗi khối nước tiêu thụ.</p>
              </div>

              {/* Internet */}
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

              {/* Management Fee */}
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <div className="flex items-center gap-2 text-warning-600">
                  <Landmark size={20} className="fill-warning-50 text-warning-600" />
                  <span className="font-bold text-sm text-gray-800">Phí quản lý cố định</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.managementFee)}
                    onChange={(e) => handleChange("managementFee", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-16 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/tháng</span>
                </div>
                <p className="text-[11px] text-gray-400">Phí quản lý chung cố định hàng tháng cho mỗi căn hộ.</p>
              </div>

              {/* Management Fee Per M2 */}
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

          {/* Parking Fees */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Biểu Phí Trông Giữ Xe</h3>
              <p className="text-xs text-gray-400 mt-0.5">Đặt mức phí trông giữ phương tiện hàng tháng</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Motorbike */}
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <span className="font-bold text-sm text-gray-800 block">Phí gửi xe máy</span>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.motorbikeParkingRate)}
                    onChange={(e) => handleChange("motorbikeParkingRate", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-16 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/tháng</span>
                </div>
              </div>

              {/* Car */}
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 space-y-3">
                <span className="font-bold text-sm text-gray-800 block">Phí gửi ô tô</span>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(fees.carParkingRate)}
                    onChange={(e) => handleChange("carParkingRate", e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-3 pr-16 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ/tháng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
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
