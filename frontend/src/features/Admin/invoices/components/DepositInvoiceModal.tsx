import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import DatePicker from "../../../../components/ui/DatePicker";
import type { Apartment } from "../../../../types";
import type { DepositForm, DepositInvoiceController } from "../hooks/useDepositInvoice";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import { formatDateToISO } from "../../../../utils/date";

export interface DepositInvoiceModalProps {
  role?: string | null;
  controller?: DepositInvoiceController;
  isOpen?: boolean;
  onClose?: () => void;
  form?: DepositForm;
  setForm?: React.Dispatch<React.SetStateAction<DepositForm>>;
  fixedApartment?: Apartment | null;
  selectedApartment?: Apartment | null;
  isLoadingAvailableApartments?: boolean;
  buildingOptions?: { value: string; label: string }[];
  floorOptions?: { value: string; label: string }[];
  apartmentOptions?: { value: string; label: string }[];
  onBuildingChange?: (value: string) => void;
  onFloorChange?: (value: string) => void;
  onApartmentChange?: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  isPending?: boolean;
}

export default function DepositInvoiceModal(props: DepositInvoiceModalProps) {
  const modalIsOpen = props.controller ? props.controller.isOpen : (props.isOpen ?? false);
  const modalOnClose = props.controller ? props.controller.closeModal : (props.onClose ?? (() => {}));
  const form = props.controller ? props.controller.form : props.form!;
  const setForm = props.controller ? props.controller.setForm : props.setForm!;
  const fixedApartment = props.fixedApartment;
  const selectedApartment = props.controller ? props.controller.selectedApartment : props.selectedApartment;
  const isLoadingAvailableApartments = props.controller ? props.controller.isLoadingAvailableApartments : (props.isLoadingAvailableApartments ?? false);
  const buildingOptions = props.controller ? props.controller.buildingOptions : (props.buildingOptions ?? []);
  const floorOptions = props.controller ? props.controller.floorOptions : (props.floorOptions ?? []);
  const apartmentOptions = props.controller ? props.controller.apartmentOptions : (props.apartmentOptions ?? []);
  const onBuildingChange = props.controller ? props.controller.handleBuildingChange : props.onBuildingChange;
  const onFloorChange = props.controller ? props.controller.handleFloorChange : props.onFloorChange;
  const onApartmentChange = props.controller ? props.controller.handleApartmentChange : props.onApartmentChange;
  const onSubmit = props.controller ? props.controller.handleSubmit : (props.onSubmit ?? (() => {}));
  const isPending = props.controller ? props.controller.isPending : (props.isPending ?? false);
  const isManager = props.controller ? props.controller.isManager : (props.role === "MANAGER");

  const targetApartment = fixedApartment || selectedApartment;

  const handleChange = (key: keyof DepositForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <Modal isOpen={modalIsOpen} onClose={modalOnClose} title="Lập hóa đơn đặt cọc" size="lg">
      <form onSubmit={onSubmit} className="space-y-4 text-left font-sans">
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
                value={form?.building_id || ""}
                onChange={(val) => onBuildingChange && onBuildingChange(val)}
                placeholder={isLoadingAvailableApartments ? "Đang tải..." : "Chọn chi nhánh"}
                disabled={isManager || isLoadingAvailableApartments || isPending}
                triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
                clearable={!isManager}
              />
              <Combobox
                label="Tầng"
                options={floorOptions}
                value={form?.floor || ""}
                onChange={(val) => onFloorChange && onFloorChange(val)}
                placeholder="Chọn tầng"
                disabled={!form?.building_id || isLoadingAvailableApartments || isPending}
                triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
                clearable={true}
              />
              <Combobox
                label="Căn hộ"
                options={apartmentOptions}
                value={form?.apartment_id || ""}
                onChange={(val) => onApartmentChange && onApartmentChange(val)}
                placeholder="Chọn căn hộ"
                disabled={!form?.floor || isLoadingAvailableApartments || isPending}
                triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
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
          value={form?.full_name || ""}
          onChange={handleChange("full_name")}
          required
          disabled={isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Số điện thoại"
            value={form?.phone || ""}
            onChange={handleChange("phone")}
            disabled={isPending}
          />
          <Input
            label="Email"
            type="email"
            value={form?.email || ""}
            onChange={handleChange("email")}
            required
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="CCCD"
            value={form?.citizen_id || ""}
            onChange={handleChange("citizen_id")}
            required
            disabled={isPending}
          />
          <div>
            <label className="text-sm font-semibold text-gray-850 mb-1.5 block">Ngày sinh</label>
            <DatePicker
              value={form?.date_of_birth || ""}
              onChange={(date) => setForm((prev) => ({ ...prev, date_of_birth: formatDateToISO(date) }))}
              placeholder="Chọn ngày sinh"
              disabled={isPending}
            />
          </div>
        </div>

        <Input
          label="Địa chỉ thường trú"
          value={form?.address || ""}
          onChange={handleChange("address")}
          disabled={isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-850 mb-1.5 block">
              Ngày dọn vào dự kiến *
            </label>
            <DatePicker
              value={form?.move_in_date || ""}
              onChange={(date) => setForm((prev) => ({ ...prev, move_in_date: formatDateToISO(date) }))}
              placeholder="Chọn ngày dọn vào"
              disabled={isPending}
            />
          </div>
          <Input
            label="Số tiền đặt cọc (VND) *"
            type="number"
            value={form?.deposit_amount || 0}
            onChange={(e) => setForm((prev) => ({ ...prev, deposit_amount: Number(e.target.value) }))}
            required
            disabled={isPending}
          />
        </div>

        <Combobox
          label="Phương thức thanh toán tiền cọc *"
          options={[
            { value: "VNPAY", label: "VNPay (gửi liên kết thanh toán qua email)" },
            { value: "CASH", label: "Tiền mặt (đã thu tại quầy)" },
          ]}
          value={form?.payment_method || "VNPAY"}
          onChange={(value) => setForm((prev) => ({
            ...prev,
            payment_method: value as DepositForm["payment_method"],
          }))}
          searchable={false}
          clearable={false}
          disabled={isPending}
          triggerClassName="h-10 rounded-xl border-gray-300 px-3.5"
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={modalOnClose} disabled={isPending} className="rounded-xl">
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={isPending} className="rounded-xl">
            {isPending ? "Đang xử lý..." : "Xác nhận & Lập hóa đơn cọc"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
