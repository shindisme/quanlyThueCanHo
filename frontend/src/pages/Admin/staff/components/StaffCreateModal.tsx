import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useStaffCreate } from "../../../../hooks/admin/useStaffCreate";

interface StaffCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POSITIONS = ["Quản lý", "Bảo vệ", "Vệ sinh", "Kỹ thuật", "Kế toán"];

export default function StaffCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: StaffCreateModalProps) {
  const {
    fullName,
    setFullName,
    phone,
    setPhone,
    position,
    setPosition,
    buildingId,
    setBuildingId,
    buildings,
    loading,
    saving,
    nextUsername,
    handleSave,
    managedBuildingIds,
  } = useStaffCreate({ isOpen, onClose, onSuccess, positions: POSITIONS });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm nhân viên mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} isLoading={saving} disabled={loading}>Thêm mới</Button>
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
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Họ tên *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Combobox
              label="Chức vụ *"
              options={POSITIONS.map((pos) => ({ value: pos, label: pos }))}
              value={position}
              onChange={(val) => setPosition(val)}
              placeholder="Chọn chức vụ"
              searchable={false}
              triggerClassName="rounded-md"
              clearable={false}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Combobox
              label="Tòa nhà làm việc"
              options={buildings.map((b) => {
                const isAlreadyManaged = position === "Quản lý" && managedBuildingIds.includes(b.id);
                return {
                  value: String(b.id),
                  label: `${b.branch_name} ${isAlreadyManaged ? "(Đã có Quản lý)" : ""}`,
                  disabled: isAlreadyManaged
                };
              })}
              value={buildingId ? String(buildingId) : ""}
              onChange={(val) => setBuildingId(val ? Number(val) : "")}
              placeholder="-- Chưa gán tòa nhà --"
              searchPlaceholder="Tìm tòa nhà..."
              triggerClassName="rounded-md"
              clearable={true}
            />
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tài khoản liên kết (Tự động cấp)</label>
            <div className="premium-input rounded-md bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-650 font-semibold">
              Tài khoản: <span className="text-primary-600">{nextUsername || "Đang ..."}</span> (Mật khẩu ngẫu nhiên sẽ được tạo tự động)
            </div>
          </div>
        </div>
      </div>
      )}
    </Modal>
  );
}

