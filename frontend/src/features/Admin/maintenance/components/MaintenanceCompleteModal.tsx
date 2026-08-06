import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import CurrencyInput from "../../../../components/ui/CurrencyInput";

interface MaintenanceCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  chargeTenant: boolean;
  setChargeTenant: (val: boolean) => void;
  repairFee: string | number;
  setRepairFee: (val: string) => void;
  onCompleteSubmit: (e: React.FormEvent) => void;
}

export default function MaintenanceCompleteModal({
  isOpen,
  onClose,
  saving,
  chargeTenant: isTenantResponsible,
  setChargeTenant: setIsTenantResponsible,
  repairFee,
  setRepairFee,
  onCompleteSubmit,
}: MaintenanceCompleteModalProps) {
  const isSubmitDisabled = saving || (isTenantResponsible && (!repairFee || Number(repairFee) <= 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Nhận Hoàn Thành Sửa Chữa">
      <form onSubmit={onCompleteSubmit} className="space-y-4 font-sans">
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 block">Hình thức tính chi phí sửa chữa</label>
          <div className="grid grid-cols-1 gap-2.5">
            <label className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${!isTenantResponsible ? "border-violet-500 bg-violet-50/30" : "border-gray-200 hover:bg-gray-50/50"
              }`}>
              <input
                type="radio"
                name="is_tenant_responsible"
                checked={!isTenantResponsible}
                onChange={() => setIsTenantResponsible(false)}
                className="mt-0.5 text-violet-600 focus:ring-violet-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-gray-800">Bảo trì cơ sở vật chất (Không tốn phí)</p>
                <p className="text-gray-500 mt-0.5">Chi phí do ban quản lý / chủ nhà chịu trách nhiệm.</p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${isTenantResponsible ? "border-violet-500 bg-violet-50/30" : "border-gray-200 hover:bg-gray-50/50"
              }`}>
              <input
                type="radio"
                name="is_tenant_responsible"
                checked={isTenantResponsible}
                onChange={() => setIsTenantResponsible(true)}
                className="mt-0.5 text-violet-600 focus:ring-violet-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-gray-800">Do người thuê làm hư hại (Tính phí)</p>
                <p className="text-gray-500 mt-0.5">Tự động sinh hóa đơn phí sửa chữa cho cư dân thanh toán.</p>
              </div>
            </label>
          </div>
        </div>

        {isTenantResponsible && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <CurrencyInput
              label="Số tiền phí sửa chữa (VNĐ) *"
              value={Number(repairFee) || undefined}
              onChange={(val) => setRepairFee(String(val || 0))}
              disabled={saving}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-xl">
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={isSubmitDisabled} className="rounded-xl">
            Xác nhận hoàn thành
          </Button>
        </div>
      </form>
    </Modal>
  );
}
