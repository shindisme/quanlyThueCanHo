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
  const [managementFee] = useState("50000"); // 50k VND flat
  const [managementFeePerM2] = useState("0");
  const [electricUnitPrice] = useState("3500"); // 3.5k VND / kWh
  const [waterUnitPrice] = useState("15000"); // 15k VND / m3
  const [internetFee] = useState("150000"); // 150k VND flat
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
            <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Đơn giá dịch vụ áp dụng</h5>
            <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full border border-gray-200">Cố định hệ thống</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 select-none">Đơn giá Điện (VND / kWh)</label>
              <Input
                type="text"
                value="Theo biểu giá EVN"
                disabled
                className="rounded-lg bg-gray-50 text-gray-500 font-medium h-[42px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 select-none">Đơn giá Nước (VND / m³)</label>
              <Input
                type="text"
                value="25,000"
                disabled
                className="rounded-lg bg-gray-50 text-gray-500 font-medium h-[42px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 select-none">Phí dịch vụ cố định (VND)</label>
              <Input
                type="text"
                value="300,000"
                disabled
                className="rounded-lg bg-gray-50 text-gray-500 font-medium h-[42px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 select-none">Phí quản lý cố định (VND)</label>
              <Input
                type="text"
                value="0"
                disabled
                className="rounded-lg bg-gray-50 text-gray-500 font-medium h-[42px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 select-none">Phí quản lý theo m² (VND / m²)</label>
              <Input
                type="text"
                value="10,000"
                disabled
                className="rounded-lg bg-gray-50 text-gray-500 font-medium h-[42px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isGenerating} className="rounded-none">
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={isGenerating} className="rounded-lg">
            {isGenerating ? "Đang tính tiền..." : "Xác nhận & Tạo hóa đơn"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
