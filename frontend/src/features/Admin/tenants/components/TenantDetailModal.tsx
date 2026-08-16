import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { Tenant } from "../../../../types";
import { getPreferredContract } from "../../../../utils/contract";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";

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
  if (!tenant) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết người thuê"
        size="md"
        footer={<Button onClick={onClose}>Đóng</Button>}
      >
        <div className="text-center text-gray-500 py-8">
          Không có dữ liệu người thuê.
        </div>
      </Modal>
    );
  }

  // Destructure thuộc tính người thuê để rút gọn code
  const { full_name, phone, email, citizen_id, date_of_birth, address, contracts } = tenant;

  // Tìm hợp đồng đang ACTIVE, ko thì lấy cái đầu tiên 
  const activeContract = getPreferredContract(contracts);
  const apartment = activeContract?.apartment;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết người thuê"
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      <div className="space-y-4 font-sans text-sm">
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Họ và tên:</span>
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">{full_name}</span>
        </div>
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Số điện thoại:</span>
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">{phone || "-"}</span>
        </div>
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Email:</span>
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">{email || "-"}</span>
        </div>
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Số CCCD:</span>
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">{citizen_id}</span>
        </div>
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Ngày sinh:</span>
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">
            {date_of_birth ? formatDate(date_of_birth) : "-"}
          </span>
        </div>
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Địa chỉ:</span>
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">{address || "-"}</span>
        </div>
        {apartment && (
          <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium shrink-0">Căn hộ đang thuê:</span>
            <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">
              {formatApartmentDisplay(
                apartment.room_number,
                apartment.floor,
                apartment.building?.branch_name
              )}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
