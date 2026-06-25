import Modal from "../../../../components/ui/Modal"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"
import type { ApartmentData } from "../../../../services/apartmentService"
import type { BuildingData } from "../../../../services/buildingService"
import type { Tenant } from "../../../../types"
import { formatCurrency } from "../../../../utils/format"
import { useContractCreate } from "../../../../hooks/useContractCreate"

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
}: ContractCreateModalProps) {
  const {
    register,
    handleFormSubmit,
    setValue,
    errors,
    saving,
    isNewTenant,
    tenantIdValue,
    buildingIdValue,
    floorValue,
    apartmentIdValue,
    actualOccupantsValue,
    monthlyRentValue,
    depositAmountValue,
    maxOccupants,
    formFloors,
    formApartments,
    buildingApartments,
  } = useContractCreate({
    isOpen,
    onClose,
    onSuccess,
    currentUser,
    role,
    managerBuildingId,
    initialTenantId,
    initialBuildingId,
    apartments,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo hợp đồng mới"
      size="lg"
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
                <select
                  value={tenantIdValue || ""}
                  onChange={(e) => setValue("tenant_id", e.target.value ? Number(e.target.value) : null)}
                  className={`premium-select w-full rounded-xl ${errors.tenant_id ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
                >
                  <option value="">Chọn người thuê</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.citizen_id})
                    </option>
                  ))}
                </select>
                {errors.tenant_id && (
                  <p className="mt-1 text-xs text-danger-500">{errors.tenant_id.message}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                <div className="col-span-12">
                  <Input
                    label="Họ tên *"
                    placeholder="VD: Nguyễn Văn A"
                    {...register("new_tenant_name")}
                    error={errors.new_tenant_name?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Số CCCD *"
                    placeholder="VD: Nhập "
                    {...register("new_tenant_cccd")}
                    error={errors.new_tenant_cccd?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Ngày sinh"
                    type="date"
                    {...register("new_tenant_dob")}
                    error={errors.new_tenant_dob?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="VD: tenant@gmail.com"
                    {...register("new_tenant_email")}
                    error={errors.new_tenant_email?.message}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Số điện thoại"
                    placeholder="VD: 0901234567"
                    {...register("new_tenant_phone")}
                    error={errors.new_tenant_phone?.message}
                  />
                </div>
                <div className="col-span-12">
                  <Input
                    label="Địa chỉ"
                    placeholder="VD: 123 Đường ABC, Quận 1"
                    {...register("new_tenant_address")}
                    error={errors.new_tenant_address?.message}
                  />
                </div>
              </div>
            )}
          </div>

          {role !== "MANAGER" && (
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh *</label>
              <select
                value={buildingIdValue || ""}
                onChange={(e) => {
                  setValue("building_id", e.target.value ? Number(e.target.value) : (undefined as unknown as number))
                  setValue("floor", undefined as unknown as number)
                  setValue("apartment_id", undefined as unknown as number)
                }}
                disabled={role === "MANAGER"}
                className={`premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500 ${errors.building_id ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
              >
                <option value="">Chọn chi nhánh</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
              {errors.building_id && (
                <p className="mt-1 text-xs text-danger-500">{errors.building_id.message}</p>
              )}
            </div>
          )}

          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tầng *</label>
            <select
              value={floorValue || ""}
              onChange={(e) => {
                setValue("floor", e.target.value ? Number(e.target.value) : (undefined as unknown as number))
                setValue("apartment_id", undefined as unknown as number)
              }}
              disabled={!buildingIdValue}
              className={`premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500 ${errors.floor ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            >
              <option value="">Chọn tầng</option>
              {formFloors.map((floor) => (
                <option key={floor} value={floor}>Tầng {floor}</option>
              ))}
            </select>
            {errors.floor && (
              <p className="mt-1 text-xs text-danger-500">{errors.floor.message}</p>
            )}
          </div>

          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Căn hộ *</label>
            <select
              value={apartmentIdValue || ""}
              onChange={(e) => setValue("apartment_id", e.target.value ? Number(e.target.value) : (undefined as unknown as number))}
              disabled={!floorValue}
              className={`premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500 ${errors.apartment_id ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            >
              <option value="">Chọn căn hộ</option>
              {formApartments.map((a) => (
                <option key={a.id} value={a.id}>P.{a.room_number} ({a.area}m²)</option>
              ))}
            </select>
            {errors.apartment_id && (
              <p className="mt-1 text-xs text-danger-500">{errors.apartment_id.message}</p>
            )}
          </div>

          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày bắt đầu *</label>
            <input
              type="date"
              {...register("start_date")}
              className={`premium-input rounded-xl ${errors.start_date ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            />
            {errors.start_date && (
              <p className="mt-1 text-xs text-danger-500">{errors.start_date.message}</p>
            )}
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày kết thúc *</label>
            <input
              type="date"
              {...register("end_date")}
              className={`premium-input rounded-xl ${errors.end_date ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            />
            {errors.end_date && (
              <p className="mt-1 text-xs text-danger-500">{errors.end_date.message}</p>
            )}
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số lượng người ở thực tế {apartmentIdValue ? `(Tối đa: ${maxOccupants} người)` : ""} *
            </label>
            <input
              type="number"
              min={1}
              value={actualOccupantsValue || ""}
              {...register("actual_occupants", { valueAsNumber: true })}
              className={`premium-input rounded-xl ${errors.actual_occupants ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            />
            {errors.actual_occupants && (
              <p className="mt-1 text-xs text-danger-500">{errors.actual_occupants.message}</p>
            )}
          </div>

          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiền thuê/tháng (VND) *</label>
            <input
              type="number"
              value={monthlyRentValue || 0}
              {...register("monthly_rent", { valueAsNumber: true })}
              className={`premium-input rounded-xl ${errors.monthly_rent ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            />
            {errors.monthly_rent && (
              <p className="mt-1 text-xs text-danger-500">{errors.monthly_rent.message}</p>
            )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiền cọc (VND) *</label>
            <input
              type="number"
              value={depositAmountValue || 0}
              {...register("deposit_amount", { valueAsNumber: true })}
              className={`premium-input rounded-xl ${errors.deposit_amount ? "border-danger-500 focus:ring-danger-500/20" : ""}`}
            />
            {errors.deposit_amount && (
              <p className="mt-1 text-xs text-danger-500">{errors.deposit_amount.message}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
