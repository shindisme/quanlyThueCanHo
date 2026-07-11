import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import type { Staff } from "../../../../types";
import { useStaffModify } from "../hooks/useStaffModify";

interface StaffModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Staff | null;
}

const POSITIONS = ["Quản lý", "Bảo vệ", "Vệ sinh", "Kỹ thuật", "Kế toán"];

export default function StaffModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: StaffModifyModalProps) {
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
    handleSave,
    managedBuildingIds,
    hasLinkedUser,
    nextUsername,
  } = useStaffModify({
    isOpen,
    onClose,
    onSuccess,
    editItem,
    positions: POSITIONS,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin nhân viên"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} isLoading={saving} disabled={loading}>Cập nhật</Button>
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
                  const isAlreadyManaged =
                    position === "Quản lý" &&
                    managedBuildingIds.includes(b.id) &&
                    b.id !== editItem?.building_id;
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

            {(position === "Quản lý" || position === "Kỹ thuật") && (
              !hasLinkedUser ? (
                <div className="col-span-12 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cấp tài khoản tự động</label>
                  <div className="premium-input rounded-md bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-600 font-semibold">
                    Tài khoản: <span className="text-primary-600">{nextUsername || "Đang tính..."}</span> (Mật khẩu ngẫu nhiên sẽ được tạo tự động)
                  </div>
                </div>
              ) : (
                <div className="col-span-12 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tài khoản liên kết đã có</label>
                  <div className="premium-input rounded-md bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-500 font-semibold">
                    Tài khoản: @{editItem?.user?.username}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

