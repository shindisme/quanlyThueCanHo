import { Plus } from "lucide-react"
import Modal from "../../../../components/ui/Modal"
import Button from "../../../../components/ui/Button"
import Select from "../../../../components/ui/Select"
import { useBuildingCreate } from "../../../../hooks/useBuildingCreate"

interface BuildingCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function BuildingCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: BuildingCreateModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    onSubmit,
    errors,
    saving,
    availableManagers,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    staffIdValue,
  } = useBuildingCreate({ isOpen, onClose, onSuccess })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm tòa nhà mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving}>Thêm mới</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          {/* branch_name */}
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên chi nhánh/tòa nhà *</label>
            <input
              type="text"
              {...register("branch_name")}
              placeholder="VD: Chi nhánh Quận 1"
              className={`premium-input rounded-xl ${errors.branch_name ? "border-danger-500 focus:ring-danger-500" : ""}`}
            />
            {errors.branch_name && (
              <p className="mt-1 text-xs text-danger-500">{errors.branch_name.message}</p>
            )}
          </div>

          {/* address_old */}
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ cũ *</label>
            <input
              type="text"
              {...register("address_old")}
              placeholder="VD: 123 Nguyễn Huệ, Quận 1"
              className={`premium-input rounded-xl ${errors.address_old ? "border-danger-500 focus:ring-danger-500" : ""}`}
            />
            {errors.address_old && (
              <p className="mt-1 text-xs text-danger-500">{errors.address_old.message}</p>
            )}
          </div>

          {/* address_new */}
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ mới *</label>
            <input
              type="text"
              {...register("address_new")}
              placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1"
              className={`premium-input rounded-xl ${errors.address_new ? "border-danger-500 focus:ring-danger-500" : ""}`}
            />
            {errors.address_new && (
              <p className="mt-1 text-xs text-danger-500">{errors.address_new.message}</p>
            )}
          </div>

          {/* total_floors */}
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tầng *</label>
            <input
              type="number"
              {...register("total_floors", { valueAsNumber: true })}
              className={`premium-input rounded-xl ${errors.total_floors ? "border-danger-500 focus:ring-danger-500" : ""}`}
            />
            {errors.total_floors && (
              <p className="mt-1 text-xs text-danger-500">{errors.total_floors.message}</p>
            )}
          </div>

          {/* staff_id */}
          <div className="col-span-12">
            <Select
              label="Quản lý bởi"
              value={staffIdValue || ""}
              onChange={(e) => setValue("staff_id", e.target.value ? Number(e.target.value) : null)}
              placeholder="-- Chưa phân công --"
              options={availableManagers.map((s) => ({
                value: String(s.id),
                label: `${s.full_name} (${s.user?.username || s.position})`,
              }))}
              error={errors.staff_id?.message}
            />
          </div>

          {/* image bìa */}
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh bìa tòa nhà</label>
            <div className="flex items-center gap-4">
              {previewUrl ? (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full text-[10px] shadow w-4 h-4 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/10 transition-colors shrink-0">
                  <Plus className="text-gray-400" size={20} />
                  <span className="text-[10px] text-gray-400 mt-1">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              <div className="text-xs text-gray-400">
                <p>Hỗ trợ JPG, PNG, WEBP.</p>
                <p>Tải ảnh lên ImageKit để lấy URL lưu trữ.</p>
              </div>
            </div>
          </div>

          {/* description */}
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Mô tả ngắn gọn về tòa nhà..."
              className="premium-input rounded-xl resize-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
