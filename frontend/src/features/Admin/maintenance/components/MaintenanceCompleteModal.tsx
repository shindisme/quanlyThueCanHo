import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";

interface MaintenanceCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  chargeTenant: boolean;
  setChargeTenant: (val: boolean) => void;
  repairFee: string;
  setRepairFee: (val: string) => void;
  onCompleteSubmit: (e: React.FormEvent) => void;
}

export default function MaintenanceCompleteModal({
  isOpen,
  onClose,
  saving,
  chargeTenant,
  setChargeTenant,
  repairFee,
  setRepairFee,
  onCompleteSubmit,
}: MaintenanceCompleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Nhận Hoàn Thành Sửa Chữa">
      <form onSubmit={onCompleteSubmit} className="space-y-4 font-sans">
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 block">Hình thức tính chi phí sửa chữa</label>
          <div className="grid grid-cols-1 gap-2.5">
            <label className="flex items-center gap-2.5 p-3 border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-all">
              <input
                type="radio"
                name="charge_tenant"
                checked={!chargeTenant}
                onChange={() => setChargeTenant(false)}
                className="text-violet-600 focus:ring-violet-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-gray-800">Bảo trì cơ sở vật chất (Không tốn phí)</p>
                <p className="text-gray-500 mt-0.5">Chi phí do ban quản lý / chủ nhà chịu trách nhiệm.</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-all">
              <input
                type="radio"
                name="charge_tenant"
                checked={chargeTenant}
                onChange={() => setChargeTenant(true)}
                className="text-violet-600 focus:ring-violet-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-gray-800">Do người thuê làm hư hại</p>
                <p className="text-gray-500 mt-0.5">Tự động sinh hóa đơn phí sửa chữa cho cư dân thanh toán.</p>
              </div>
            </label>
          </div>
        </div>

        {chargeTenant && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <Input
              label="Số tiền phí sửa chữa (VNĐ) *"
              type="number"
              value={repairFee}
              onChange={(e) => setRepairFee(e.target.value)}
              placeholder="Nhập số tiền phí sửa chữa"
              required={chargeTenant}
              disabled={saving}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={saving || (chargeTenant && (!repairFee || Number(repairFee) <= 0))}>
            Xác nhận hoàn thành
          </Button>
        </div>
      </form>
    </Modal>
  );
}
