import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import DatePicker from "../../../../components/ui/DatePicker";
import FeeSettingsSection from "./FeeSettingsSection";
import { useGenerateInvoice } from "../hooks/useGenerateInvoice";
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

export default function InvoiceGenerateModal({
  isOpen,
  onClose,
  buildings,
  isGenerating,
  onGenerate,
  role,
  managedBuildingId,
}: InvoiceGenerateModalProps) {
  const {
    month,
    setMonth,
    year,
    setYear,
    buildingId,
    setBuildingId,
    dueDate,
    handleDateChange,
    notify,
    setNotify,
    managementFeePerM2,
    setManagementFeePerM2,
    internetFee,
    setInternetFee,
    feeSettings,
    handleSubmit,
    monthOptions,
    yearOptions,
  } = useGenerateInvoice({ isOpen, role, managedBuildingId, onGenerate });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tính Tiền & Tạo Hóa Đơn Hàng Tháng" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-sans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Tháng *</label>
            <Combobox
              options={monthOptions}
              value={month}
              onChange={setMonth}
              triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
              clearable={true}
              searchable={false}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Năm *</label>
            <Combobox
              options={yearOptions}
              value={year}
              onChange={setYear}
              triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
              clearable={true}
              searchable={false}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Tòa nhà *</label>
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingId}
              onChange={setBuildingId}
              triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
              placeholder="Chọn tòa nhà"
              clearable={true}
              disabled={role === "MANAGER"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Hạn thanh toán *</label>
            <DatePicker
              value={dueDate}
              onChange={handleDateChange}
              placeholder="Chọn hạn thanh toán"
            />
          </div>
          <div className="flex items-center pb-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              Gửi email thông báo cho người thuê ngay sau khi tạo
            </label>
          </div>
        </div>

        {/* Section biểu phí */}
        <FeeSettingsSection
          feeSettings={feeSettings}
          internetFee={internetFee}
          setInternetFee={setInternetFee}
          managementFeePerM2={managementFeePerM2}
          setManagementFeePerM2={setManagementFeePerM2}
        />

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