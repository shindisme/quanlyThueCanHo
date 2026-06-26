import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import { useStaffCreate } from "../../../../hooks/useStaffCreate";

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
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={loading}>Thêm mới</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Họ tên *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0987654321"
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
              Tài khoản: <span className="text-primary-600">{nextUsername || "Đang tính..."}</span> (Mật khẩu mặc định: 123456)
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
Name="text-primary-600">{nextUsername || "Đang tính..."}</span> (Mật khẩu mặc định: 123456)
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
