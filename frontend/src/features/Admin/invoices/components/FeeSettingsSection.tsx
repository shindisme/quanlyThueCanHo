import Input from "../../../../components/ui/Input";
import { formatCurrency } from "../../../../utils/currency";
import type { FeeSettings } from "../../../../utils/feeSettings";

interface FeeSettingsSectionProps {
  feeSettings: FeeSettings;
  internetFee: string;
  setInternetFee: (val: string) => void;
  managementFeePerM2: string;
  setManagementFeePerM2: (val: string) => void;
}

export default function FeeSettingsSection({
  feeSettings,
  internetFee,
  setInternetFee,
  managementFeePerM2,
  setManagementFeePerM2,
}: FeeSettingsSectionProps) {
  return (
    <div className="border border-gray-200 bg-gray-50/60 p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
          Biểu phí áp dụng
        </h5>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <span className="font-semibold text-gray-600 block mb-1">Điện 6 bậc (đ/kWh):</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {feeSettings.electricityRates.map((rate, idx) => (
              <div key={`electric-tier-${idx + 1}`} className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-400 font-bold block">B{idx + 1}</span>
                <span className="font-bold text-gray-800">{formatCurrency(rate)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="font-semibold text-gray-600 block mb-1">Nước 3 bậc (đ/m³):</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {feeSettings.waterRates.map((rate, idx) => (
              <div key={`water-tier-${idx + 1}`} className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-400 font-bold block">B{idx + 1}</span>
                <span className="font-bold text-gray-800">{formatCurrency(rate)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
        <div>
          <label className="text-xs font-semibold text-gray-650 block mb-1">Phí dịch vụ & Internet (VND)</label>
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
  );
}
