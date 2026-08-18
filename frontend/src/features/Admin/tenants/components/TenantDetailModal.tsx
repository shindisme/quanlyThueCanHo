import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { Tenant } from "../../../../types";
import { findActiveContract } from "../../../../utils/contract";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";

export type TenantModalData =
  | Tenant
  | Partial<Tenant>
  | (Partial<Omit<Tenant, "user">> & {
    user?: { id?: number; username?: string; role?: string; status?: string; created_at?: string } | null;
  })
  | null;

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantModalData;
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

  const { full_name, phone, email, citizen_id, date_of_birth, address, contracts } = tenant;

  // Tìm hợp đồng đang ACTIVE hoặc ENDED
  const activeContract = findActiveContract(contracts);
  const currentApartment = activeContract?.apartment;

  const endedContract = !currentApartment
    ? contracts?.find((c) => c.status === "ENDED" && c.apartment)
    : null;
  const pastApartmentDisplay = endedContract?.apartment
    ? formatApartmentDisplay(
      endedContract.apartment.room_number,
      endedContract.apartment.floor,
      endedContract.apartment.building?.branch_name || endedContract.apartment.building?.name
    )
    : null;
  const displayAddress = address || "-";

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
          <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">{displayAddress}</span>
        </div>
        {/* Căn hộ đang thuê */}
        <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
          <span className="text-gray-500 font-medium shrink-0">Căn hộ đang thuê:</span>
          {currentApartment ? (
            <span className="font-semibold text-gray-800 text-right wrap-break-word max-w-[65%]">
              {formatApartmentDisplay(
                currentApartment.room_number,
                currentApartment.floor,
                currentApartment.building?.branch_name || currentApartment.building?.name
              )}
            </span>
          ) : (
            <span className="italic text-gray-400 text-right text-sm">Trống</span>
          )}
        </div>
        {/* Căn hộ từng thuê*/}
        {pastApartmentDisplay && (
          <div className="flex justify-between items-start gap-4 border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium shrink-0">Căn hộ từng thuê:</span>
            <span className="font-semibold text-amber-700 text-right wrap-break-word max-w-[65%]">
              {pastApartmentDisplay}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
