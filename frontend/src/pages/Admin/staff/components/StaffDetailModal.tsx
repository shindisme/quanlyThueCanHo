import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { Staff } from "../../../../types";
import { formatDate } from "../../../../utils/date";

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  buildingName: string;
}

export default function StaffDetailModal({
  isOpen,
  onClose,
  staff,
  buildingName,
}: StaffDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết nhân viên"
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      {staff && (
        <div className="space-y-4 font-sans text-sm">
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Họ và tên:</span>
            <span className="font-semibold text-gray-800">{staff.full_name}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Số điện thoại:</span>
            <span className="font-semibold text-gray-800">{staff.phone || "-"}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Chức vụ:</span>
            <span className="font-semibold text-blue-600">{staff.position}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Tòa nhà làm việc:</span>
            <span className="font-semibold text-gray-800">{buildingName}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Tài khoản liên kết:</span>
            <span className="font-semibold text-gray-800">
              {staff.user?.username ? `@${staff.user.username}` : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Ngày vào làm:</span>
            <span className="font-semibold text-gray-800">
              {staff.created_at ? formatDate(staff.created_at) : "-"}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
