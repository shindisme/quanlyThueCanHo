import Modal from "../../../../components/ui/Modal"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"
import Combobox from "../../../../components/ui/Combobox"
import { Calendar } from "../../../../components/ui/Calendar"
import type { ApartmentData } from "../../../../services/apartmentService"
import type { BuildingData } from "../../../../services/buildingService"
import type { Tenant } from "../../../../types"
import { useContractCreate } from "../../../../hooks/admin/useContractCreate"
import { formatCurrency } from "../../../../utils/currency"

interface ContractCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  buildings: BuildingData[]
  apartments: ApartmentData[]
  tenants: Tenant[]
  currentUser: { id: number }
  role: string | null
  managerBuildingId?: number
  initialTenantId?: number
  initialBuildingId?: number
  initialApartmentId?: number
  initialFloor?: number
}

export default function ContractCreateModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  apartments,
  tenants,
  currentUser,
  role,
  managerBuildingId,
  initialTenantId,
  initialBuildingId,
  initialApartmentId,
  initialFloor,
}: ContractCreateModalProps) {
  const {
    register,
    handleFormSubmit,
    setValue,
    errors,
    saving,
    loadingApartments,
    isNewTenant,
    tenantIdValue,
    buildingIdValue,
    floorValue,
    apartmentIdValue,
    newTenantDobValue,
    startDateValue,
    endDateValue,
    formFloors,
    formApartments,
    actualOccupantsValue,
    monthlyRentValue,
    depositAmountValue,
    maxOccupants,
    buildingApartments,
  } = useContractCreate({
    isOpen,
    onClose,
    onSuccess,
    currentUser: currentUser || { id: 1 },
    role,
    managerBuildingId,
    initialTenantId,
    initialBuildingId,
    initialApartmentId,
    initialFloor,
    apartments,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo hợp đồng mới"
      size="lg"
      closeOnOutsideClick={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleFormSubmit} isLoading={saving}>Tạo hợp đồng</Button>
        </>
      }
    >
      <div className="space-y-6 font-sans">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-3">
            <label className="block text-sm font-semibold text-gray-800">Thông tin người thuê *</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  checked={!isNewTenant}
                  onChange={() => setValue("is_new_tenant", false)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                Chọn người thuê có sẵn
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  checked={isNewTenant}
                  onChange={() => setValue("is_new_tenant", true)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                Thêm người thuê mới & Tạo tài khoản
              </label>
            </div>

            {!isNewTenant ? (
              <div>
                <Combobox
                  options={tenants.map((t) => ({ value: String(t.id), label: `${t.full_name} (${t.citizen_id})` }))}
                  value={tenantIdValue ? String(tenantIdValue) : ""}
                  onChange={(val) => setValue("tenant_id", val ? Number(val) : null)}
                  placeholder="Chọn người thuê"
                  searchPlaceholder="Tìm kiếm người thuê..."
                  triggerClassName="rounded-md"
                  error={errors.tenant_id?.message}
                />
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 bg-gray-50/50 p-4 rounded-md border border-gray-150">
                <div className="col-span-12">
                  <Input
                    label="Họ tên *"
                    placeholder="Nhập họ tên"
                    {...register("new_tenant_name")}
                    error={errors.new_tenant_name?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Số CCCD *"
                    placeholder="Nhập số CCCD"
                    {...register("new_tenant_cccd")}
                    error={errors.new_tenant_cccd?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
                  <Calendar
                    value={newTenantDobValue ? new Date(newTenantDobValue) : null}
                    onChange={(date) => {
                      if (!date) {
                        setValue("new_tenant_dob", "");
                        return;
                      }
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      setValue("new_tenant_dob", `${y}-${m}-${d}`);
                    }}
                    placeholder="Chọn ngày sinh..."
                  />
                  {errors.new_tenant_dob?.message && (
                    <p className="mt-1 text-xs text-danger-500">{errors.new_tenant_dob.message}</p>
                  )}
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Nhập email"
                    {...register("new_tenant_email")}
                    error={errors.new_tenant_email?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Số điện thoại"
                    placeholder="Nhập số điện thoại"
                    {...register("new_tenant_phone")}
                    error={errors.new_tenant_phone?.message}
                  />
                </div>
                <div className="col-span-12">
                  <Input
                    label="Địa chỉ"
                    placeholder="Nhập địa chỉ"
                    {...register("new_tenant_address")}
                    error={errors.new_tenant_address?.message}
                  />
                </div>
              </div>
            )}
          </div>

          {role !== "MANAGER" && (
            <div className="col-span-12 sm:col-span-6">
              <Combobox
                label="Chi nhánh *"
                options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
                value={buildingIdValue ? String(buildingIdValue) : ""}
                onChange={(val) => {
                  setValue("building_id", val ? Number(val) : (undefined as unknown as number))
                  setValue("floor", undefined as unknown as number)
                  setValue("apartment_id", undefined as unknown as number)
                }}
                disabled={role === "MANAGER"}
                placeholder="Chọn chi nhánh"
                searchPlaceholder="Tìm chi nhánh..."
                triggerClassName="rounded-md"
                error={errors.building_id?.message}
              />
            </div>
          )}

          <div className="col-span-12 sm:col-span-6">
            <Combobox
              label="Tầng *"
              options={formFloors.map((floor) => ({ value: String(floor), label: `Tầng ${floor}` }))}
              value={floorValue ? String(floorValue) : ""}
              onChange={(val) => {
                setValue("floor", val ? Number(val) : (undefined as unknown as number))
                setValue("apartment_id", undefined as unknown as number)
              }}
              disabled={!buildingIdValue || loadingApartments}
              placeholder={loadingApartments ? "Đang tải căn hộ..." : "Chọn tầng"}
              searchable={false}
              triggerClassName="rounded-md"
              error={errors.floor?.message}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <Combobox
              label="Căn hộ *"
              options={formApartments.map((a) => ({ value: String(a.id), label: `P.${a.room_number} (${a.area}m²)` }))}
              value={apartmentIdValue ? String(apartmentIdValue) : ""}
              onChange={(val) => setValue("apartment_id", val ? Number(val) : (undefined as unknown as number))}
              disabled={!floorValue || loadingApartments}
              placeholder={loadingApartments ? "Đang tải căn hộ..." : "Chọn căn hộ"}
              searchPlaceholder="Tìm căn hộ..."
              triggerClassName="rounded-md"
              error={errors.apartment_id?.message}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày bắt đầu *</label>
            <Calendar
              value={startDateValue || null}
              onChange={(date) => {
                if (!date) {
                  setValue("start_date", "");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setValue("start_date", `${y}-${m}-${d}`);
              }}
              placeholder="Chọn ngày bắt đầu..."
            />
            {errors.start_date?.message && (
              <p className="mt-1 text-xs text-danger-500">{errors.start_date.message}</p>
            )}
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày kết thúc *</label>
            <Calendar
              value={endDateValue || null}
              onChange={(date) => {
                if (!date) {
                  setValue("end_date", "");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setValue("end_date", `${y}-${m}-${d}`);
              }}
              placeholder="Chọn ngày kết thúc..."
            />
            {errors.end_date?.message && (
              <p className="mt-1 text-xs text-danger-500">{errors.end_date.message}</p>
            )}
          </div>

          <div className="col-span-12">
            <Input
              label={`Số lượng người ở thực tế ${apartmentIdValue ? `(Tối đa: ${maxOccupants} người)` : ""} *`}
              type="number"
              min={1}
              value={actualOccupantsValue || ""}
              {...register("actual_occupants", { valueAsNumber: true })}
              error={errors.actual_occupants?.message}
              className="rounded-md"
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Tiền thuê/tháng (VND) *"
              type="number"
              value={monthlyRentValue || 0}
              {...register("monthly_rent", { valueAsNumber: true })}
              error={errors.monthly_rent?.message}
              className="rounded-md"
            />
            {apartmentIdValue && (() => {
              const apt = buildingApartments.find((a) => a.id === apartmentIdValue) || apartments.find((a) => a.id === apartmentIdValue)
              const occupantsCount = Number(actualOccupantsValue) || 1
              if (apt && occupantsCount > maxOccupants) {
                return (
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                    (Phụ thu {formatCurrency((occupantsCount - maxOccupants) * 1000000)} do quá số người ở quy định)
                  </span>
                )
              }
              return null
            })()}
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Tiền cọc (VND) *"
              type="number"
              value={depositAmountValue || 0}
              {...register("deposit_amount", { valueAsNumber: true })}
              error={errors.deposit_amount?.message}
              className="rounded-md"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
