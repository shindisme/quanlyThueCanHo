import { Plus } from "lucide-react"
import Modal from "../../../../components/ui/Modal"
import Button from "../../../../components/ui/Button"
import Combobox from "../../../../components/ui/Combobox"
import Input from "../../../../components/ui/Input"
import LoadingSpinner from "../../../../components/ui/LoadingSpinner"
import { useBuildingCreate } from "../../../../hooks/admin/useBuildingCreate"

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
    loading,
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
      title="Thêm chi nhánh/tòa nhà mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saving} disabled={loading}>Thêm mới</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải...</span>
        </div>
      ) : (
        <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Tên chi nhánh */}
          <div className="col-span-6 sm:col-span-6">
            <Input
              label="Tên chi nhánh/tòa nhà *"
              type="text"
              {...register("branch_name")}
              placeholder="Nhập tên chi nhánh/toà nhà"
              error={errors.branch_name?.message}
              className="rounded-md"
            />
          </div>

          {/* Tầng */}
          <div className="col-span-6 sm:col-span-6">
            <Input
              label="Số tầng *"
              type="number"
              {...register("total_floors", { valueAsNumber: true })}
              error={errors.total_floors?.message}
              className="rounded-md"
            />
          </div>

          {/* Địa chỉ cũ */}
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Địa chỉ cũ *"
              type="text"
              {...register("address_old")}
              placeholder="Nhập địa chỉ cũ"
              error={errors.address_old?.message}
              className="rounded-md"
            />
          </div>

          {/* Địa chỉ mới */}
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Địa chỉ mới *"
              type="text"
              {...register("address_new")}
              placeholder="Nhập địa chỉ mới"
              error={errors.address_new?.message}
              className="rounded-md"
            />
          </div>

          {/* Phân công */}
          <div className="col-span-12">
            <Combobox
              label="Quản lý bởi"
              value={staffIdValue ? String(staffIdValue) : ""}
              onChange={(val) => setValue("staff_id", val ? Number(val) : null)}
              placeholder="-- Chưa phân công --"
              searchPlaceholder="Tìm người quản lý..."
              options={availableManagers.map((s) => ({
                value: String(s.id),
                label: `${s.full_name} (${s.user?.username || s.position})`,
              }))}
              triggerClassName="rounded-md"
              error={errors.staff_id?.message}
            />
          </div>

          {/* image bìa */}
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Ảnh bìa tòa nhà</label>
            <div className="flex flex-col items-center justify-center gap-3">
              {previewUrl ? (
                <div className="relative w-40 h-28 rounded-md overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-full text-xs shadow-md transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-40 h-28 border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/10 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors shadow-sm">
                  <Plus className="text-gray-400" size={24} />
                  <span className="text-xs text-gray-400 mt-1.5 font-medium">Chọn hình ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              <div className="text-xs text-gray-400 text-center">
                <p>Hỗ trợ định dạng: JPG, PNG, WEBP</p>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div className="col-span-12">
            <label className="block text-sm drop-shadow-3xl font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Mô tả ngắn gọn về tòa nhà..."
              className="premium-input rounded-md resize-none"
            />
          </div>
        </div>
      </div>
      )}
    </Modal>
  )
}
