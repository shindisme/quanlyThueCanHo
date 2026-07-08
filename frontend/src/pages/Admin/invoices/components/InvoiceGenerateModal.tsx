import { useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";

interface InvoiceGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: any[];
  isGenerating: boolean;
  onGenerate: (payload: any) => void;
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
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Form State
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [buildingId, setBuildingId] = useState(
    role === "MANAGER" && managedBuildingId ? String(managedBuildingId) : ""
  );
  
  // Set default due date to 15th of next month or 15 days from now
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 10); // 10 days from now
    return d.toISOString().split("T")[0];
  };
  const [dueDate, setDueDate] = useState(getDefaultDueDate());

  // Pricing config defaults
  const [managementFee, setManagementFee] = useState("50000"); // 50k VND flat
  const [managementFeePerM2, setManagementFeePerM2] = useState("0");
  const [electricUnitPrice, setElectricUnitPrice] = useState("3500"); // 3.5k VND / kWh
  const [waterUnitPrice, setWaterUnitPrice] = useState("15000"); // 15k VND / m3
  const [internetFee, setInternetFee] = useState("150000"); // 150k VND flat
  const [notify, setNotify] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      alert("Vui lòng chọn tòa nhà / chi nhánh!");
      return;
    }
    const payload = {
      month: Number(month),
      year: Number(year),
      building_id: Number(buildingId),
      due_date: new Date(dueDate).toISOString(),
      management_fee: Number(managementFee),
      management_fee_per_m2: Number(managementFeePerM2),
      electric_unit_price: Number(electricUnitPrice),
      water_unit_price: Number(waterUnitPrice),
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
              triggerClassName="h-[42px] rounded-none border-gray-300 px-4"
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
              triggerClassName="h-[42px] rounded-none border-gray-300 px-4"
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
              triggerClassName="h-[42px] rounded-none border-gray-300 px-4"
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
              className="rounded-none h-[42px]"
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
          <h5 className="font-bold text-gray-800 mb-3 text-xs uppercase tracking-wider">Cấu hình đơn giá dịch vụ</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Đơn giá Điện (VND / kWh)</label>
              <Input
                type="number"
                value={electricUnitPrice}
                onChange={(e) => setElectricUnitPrice(e.target.value)}
                className="rounded-none"
                required
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Đơn giá Nước (VND / m³)</label>
              <Input
                type="number"
                value={waterUnitPrice}
                onChange={(e) => setWaterUnitPrice(e.target.value)}
                className="rounded-none"
                required
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Phí Internet / Phòng (VND)</label>
              <Input
                type="number"
                value={internetFee}
                onChange={(e) => setInternetFee(e.target.value)}
                className="rounded-none"
                required
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Phí quản lý cố định (VND)</label>
              <Input
                type="number"
                value={managementFee}
                onChange={(e) => setManagementFee(e.target.value)}
                className="rounded-none"
                required
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1 select-none">Phí quản lý theo m² (VND / m²)</label>
              <Input
                type="number"
                value={managementFeePerM2}
                onChange={(e) => setManagementFeePerM2(e.target.value)}
                className="rounded-none"
                required
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isGenerating} className="rounded-none">
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={isGenerating} className="rounded-none">
            {isGenerating ? "Đang tính tiền..." : "Xác nhận & Tạo hóa đơn"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
