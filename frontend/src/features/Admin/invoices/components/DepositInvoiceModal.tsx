import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import DatePicker from "../../../../components/ui/DatePicker";
import type { Apartment } from "../../../../types";
import type { DepositForm } from "../hooks/useDepositInvoice";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";

interface DepositInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: DepositForm;
  setForm: React.Dispatch<React.SetStateAction<DepositForm>>;
  fixedApartment?: Apartment | null;
  selectedApartment?: Apartment | null;
  isLoadingAvailableApartments?: boolean;
  buildingOptions?: { value: string; label: string }[];
  floorOptions?: { value: string; label: string }[];
  apartmentOptions?: { value: string; label: string }[];
  onBuildingChange?: (value: string) => void;
  onFloorChange?: (value: string) => void;
  onApartmentChange?: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export default function DepositInvoiceModal({
  isOpen,
  onClose,
  form,
  setForm,
  fixedApartment,
  selectedApartment,
  isLoadingAvailableApartments = false,
  buildingOptions = [],
  floorOptions = [],
  apartmentOptions = [],
  onBuildingChange,
  onFloorChange,
  onApartmentChange,
  onSubmit,
  isPending,
}: DepositInvoiceModalProps) {
  const targetApartment = fixedApartment || selectedApartment;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lập hóa đơn đặt cọc" size="lg">
      <form onSubmit={onSubmit} className="space-y-4 text-left">
        {fixedApartment ? (
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3 space-y-2">
            <p className="font-semibold text-gray-850">Thông tin căn hộ đặt cọc</p>
            <Input
              label="Căn hộ *"
              value={`${formatApartmentDisplay(fixedApartment.room_number, fixedApartment.floor, fixedApartment.building?.branch_name)} (${fixedApartment.area}m²)`}
              readOnly
              className="bg-white/80 cursor-default"
            />
            <p className="text-sm text-gray-700 font-medium">
              Giá thuê: {formatCurrency(fixedApartment.rental_price)}/tháng
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3 space-y-3">
            <p className="font-semibold text-gray-850">Căn hộ đặt cọc</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Combobox
                label="Chi nhánh"
                options={buildingOptions}
                value={form.building_id}
                onChange={(val) => onBuildingChange && onBuildingChange(val)}
                placeholder={isLoadingAvailableApartments ? "Đang tải..." : "Chọn chi nhánh"}
                disabled={isLoadingAvailableApartments || isPending}
                triggerClassName="h-10.5 rounded-xl border-gray-300 px-4"
                clearable={true}
              />
              <Combobox
                label="Tầng"
                options={floorOptions}
                value={form.floor}
                onChange={(val) => onFloorChange && onFloorChange(val)}
                placeholder="Chọn tầng"
                disabled={!form.building_id || isLoadingAvailableApartments || isPending}
                triggerClassName="h-10.5 rounded-xl border-gray-300 px-4 shadow-lg"
                clearable={true}
              />
              <Combobox
                label="Căn hộ"
                options={apartmentOptions}
                value={form.apartment_id}
                onChange={(val) => onApartmentChange && onApartmentChange(val)}
                placeholder="Chọn căn hộ"
                disabled={!form.floor || isLoadingAvailableApartments || isPending}
                triggerClassName="h-10.5 rounded-xl border-gray-300 px-4 shadow-lg"
                clearable={true}
              />
            </div>

            {targetApartment && (
              <div className="rounded-lg border border-primary-100 bg-white/80 p-3 text-sm text-gray-700 space-y-1">
                <p className="font-semibold text-gray-800">Thông tin căn hộ được đặt cọc</p>
                <p>{formatApartmentDisplay(targetApartment.room_number, targetApartment.floor, targetApartment.building?.branch_name || targetApartment.building?.name)}</p>
                <p>Giá thuê: {formatCurrency(targetApartment.rental_price)}/tháng</p>
                {targetApartment.building?.address && <p>Địa chỉ: {targetApartment.building.address}</p>}
              </div>
            )}
          </div>
        )}

        <Input
          label="Họ tên người thuê"
          value={form.full_name}
          onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
          required
          disabled={isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            disabled={isPending}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="CCCD"
            value={form.citizen_id}
            onChange={(e) => setForm((prev) => ({ ...prev, citizen_id: e.target.value }))}
            required
            disabled={isPending}
          />
          <div>
            <label className="text-sm font-semibold text-gray-850 mb-1.5 block">Ngày sinh</label>
            <DatePicker
              value={form.date_of_birth}
              onChange={(date) => {
                const val = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
                setForm((prev) => ({ ...prev, date_of_birth: val }));
              }}
              placeholder="Chọn ngày sinh"
            />
          </div>
        </div>

        <Input
          label="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          disabled={isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-850 mb-1.5 block">Ngày dọn vào *</label>
            <DatePicker
              value={form.move_in_date}
              onChange={(date) => {
                const val = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
                setForm((prev) => ({ ...prev, move_in_date: val }));
              }}
              placeholder="Chọn ngày dọn vào"
            />
          </div>
          <Input
            label="Số tiền cọc"
            type="number"
            value={form.deposit_amount}
            onChange={(e) => setForm((prev) => ({ ...prev, deposit_amount: Number(e.target.value) }))}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Hủy bỏ
          </Button>
          <Button type="submit" isLoading={isPending}>
            Lập hóa đơn cọc
          </Button>
        </div>
      </form>
    </Modal>
  );
}
