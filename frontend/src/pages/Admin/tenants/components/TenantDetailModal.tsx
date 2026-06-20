import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import type { Tenant } from "../../../../types";
import { formatDate } from "../../../../utils/format";

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

export default function TenantDetailModal({
  isOpen,
  onClose,
  tenant,
}: TenantDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết người thuê"
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      {tenant && (
        <div className="space-y-4 font-sans text-sm">
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Họ và tên:</span>
            <span className="font-semibold text-gray-800">{tenant.full_name}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Số điện thoại:</span>
            <span className="font-semibold text-gray-800">{tenant.phone || "-"}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Email:</span>
            <span className="font-semibold text-gray-800">{tenant.email || "-"}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Số CCCD:</span>
            <span className="font-semibold text-gray-800">{tenant.citizen_id}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Ngày sinh:</span>
            <span className="font-semibold text-gray-800">
              {tenant.date_of_birth ? formatDate(tenant.date_of_birth) : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Địa chỉ:</span>
            <span className="font-semibold text-gray-800">{tenant.address || "-"}</span>
          </div>
          {tenant.contracts?.[0]?.apartment && (
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Căn hộ đang thuê:</span>
              <span className="font-semibold text-gray-800 text-right">
                {tenant.contracts[0].apartment.building?.branch_name || "YuKi House"} - Phòng {tenant.contracts[0].apartment.room_number} (Tầng {tenant.contracts[0].apartment.floor})
              </span>
            </div>
          )}
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Trạng thái xác thực:</span>
            <Badge variant={tenant.is_verified ? "success" : "warning"}>
              {tenant.is_verified ? "Đã xác thực" : "Chưa xác thực"}
            </Badge>
          </div>
        </div>
      )}
    </Modal>
  );
}
